/**
 * Dossier Routes - Investigation case management
 */

import express from 'express';
import postgresService from '../services/postgresService.js';

const router = express.Router();

// ===== MIDDLEWARE =====

function requireAuth(req, res, next) {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ===== DOSSIER ROUTES =====

/**
 * GET /api/dossiers?status=...&limit=...&offset=...
 * List all dossiers
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const dossiers = await postgresService.listDossiers({
      status,
      created_by: req.session.userId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({ dossiers });
  } catch (error) {
    console.error('Error listing dossiers:', error);
    res.status(500).json({ error: 'Failed to list dossiers' });
  }
});

/**
 * GET /api/dossiers/:id
 * Get a single dossier
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const dossier = await postgresService.getDossier(id);

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    res.json({ dossier });
  } catch (error) {
    console.error('Error getting dossier:', error);
    res.status(500).json({ error: 'Failed to get dossier' });
  }
});

/**
 * POST /api/dossiers
 * Create a new dossier
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const dossier = await postgresService.createDossier({
      title,
      description,
      status: status || 'active',
      created_by: req.session.userId
    });

    res.status(201).json({ dossier });
  } catch (error) {
    console.error('Error creating dossier:', error);
    res.status(500).json({ error: 'Failed to create dossier' });
  }
});

/**
 * PATCH /api/dossiers/:id
 * Update a dossier
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dossier = await postgresService.getDossier(id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    const updatedDossier = await postgresService.updateDossier(id, updates);

    res.json({ dossier: updatedDossier });
  } catch (error) {
    console.error('Error updating dossier:', error);
    res.status(500).json({ error: error.message || 'Failed to update dossier' });
  }
});

/**
 * DELETE /api/dossiers/:id
 * Delete a dossier (and all related data)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const dossier = await postgresService.getDossier(id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    await postgresService.deleteDossier(id);

    res.json({ success: true, message: 'Dossier deleted' });
  } catch (error) {
    console.error('Error deleting dossier:', error);
    res.status(500).json({ error: 'Failed to delete dossier' });
  }
});

/**
 * GET /api/dossiers/:id/stats
 * Get statistics for a dossier
 */
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const dossier = await postgresService.getDossier(id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    const stats = await postgresService.getDossierStats(id);

    res.json({
      dossier: {
        id: dossier.id,
        title: dossier.title,
        status: dossier.status
      },
      ...stats
    });
  } catch (error) {
    console.error('Error getting dossier stats:', error);
    res.status(500).json({ error: 'Failed to get dossier stats' });
  }
});

/**
 * GET /api/dossiers/:id/persons
 * Get all persons in a dossier
 */
router.get('/:id/persons', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { search, limit, offset } = req.query;

    const dossier = await postgresService.getDossier(id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    const persons = await postgresService.listPersons({
      dossier_id: id,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({ persons });
  } catch (error) {
    console.error('Error listing persons:', error);
    res.status(500).json({ error: 'Failed to list persons' });
  }
});

/**
 * GET /api/dossiers/:id/relationships
 * Get all relationships in a dossier
 */
router.get('/:id/relationships', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const dossier = await postgresService.getDossier(id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    const relationships = await postgresService.listRelationships({ dossier_id: id });

    res.json({ relationships });
  } catch (error) {
    console.error('Error listing relationships:', error);
    res.status(500).json({ error: 'Failed to list relationships' });
  }
});

/**
 * POST /api/dossiers/:id/relationships
 * Create a relationship between two persons in a dossier
 */
router.post('/:id/relationships', requireAuth, async (req, res) => {
  try {
    const { id: dossier_id } = req.params;
    const {
      person_a_id,
      person_b_id,
      relationship_type,
      description,
      confidence_score,
      evidence_refs,
      valid_from,
      valid_to
    } = req.body;

    if (!person_a_id || !person_b_id || !relationship_type) {
      return res.status(400).json({
        error: 'person_a_id, person_b_id, and relationship_type are required'
      });
    }

    const dossier = await postgresService.getDossier(dossier_id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    // Verify both persons exist and belong to this dossier
    const personA = await postgresService.getPerson(person_a_id);
    const personB = await postgresService.getPerson(person_b_id);

    if (!personA || !personB) {
      return res.status(404).json({ error: 'One or both persons not found' });
    }

    if (personA.dossier_id !== dossier_id || personB.dossier_id !== dossier_id) {
      return res.status(400).json({ error: 'Persons must belong to this dossier' });
    }

    const relationship = await postgresService.createRelationship({
      dossier_id,
      person_a_id,
      person_b_id,
      relationship_type,
      description,
      confidence_score: confidence_score !== undefined ? confidence_score : 0.5,
      evidence_refs: evidence_refs || [],
      valid_from,
      valid_to
    });

    res.status(201).json({ relationship });
  } catch (error) {
    console.error('Error creating relationship:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This relationship already exists' });
    }

    res.status(500).json({ error: error.message || 'Failed to create relationship' });
  }
});

/**
 * GET /api/dossiers/:id/relationship-graph?focus=...
 * Get relationship graph data for visualization
 */
router.get('/:id/relationship-graph', requireAuth, async (req, res) => {
  try {
    const { id: dossier_id } = req.params;
    const { focus } = req.query;

    const dossier = await postgresService.getDossier(dossier_id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    // Get all persons
    let persons = await postgresService.listPersons({ dossier_id, limit: 1000 });

    // Get all relationships
    let relationships = await postgresService.listRelationships({ dossier_id });

    // If focus person specified, filter to 2-degree connections
    if (focus) {
      const connectedIds = new Set([focus]);

      // 1st degree connections
      relationships.forEach(rel => {
        if (rel.person_a_id === focus) connectedIds.add(rel.person_b_id);
        if (rel.person_b_id === focus) connectedIds.add(rel.person_a_id);
      });

      // 2nd degree connections
      const firstDegree = [...connectedIds];
      firstDegree.forEach(personId => {
        relationships.forEach(rel => {
          if (rel.person_a_id === personId) connectedIds.add(rel.person_b_id);
          if (rel.person_b_id === personId) connectedIds.add(rel.person_a_id);
        });
      });

      // Filter persons and relationships
      persons = persons.filter(p => connectedIds.has(p.id));
      relationships = relationships.filter(r =>
        connectedIds.has(r.person_a_id) && connectedIds.has(r.person_b_id)
      );
    }

    res.json({
      nodes: persons.map(p => ({
        id: p.id,
        name: p.canonical_name,
        confidence_score: p.confidence_score
      })),
      edges: relationships.map(r => ({
        id: r.id,
        from: r.person_a_id,
        to: r.person_b_id,
        relationship_type: r.relationship_type,
        confidence_score: r.confidence_score,
        evidence_refs: r.evidence_refs || []
      }))
    });
  } catch (error) {
    console.error('Error getting relationship graph:', error);
    res.status(500).json({ error: 'Failed to get relationship graph' });
  }
});

/**
 * PATCH /api/relationships/:id
 * Update a relationship
 */
router.patch('/relationships/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const relationship = await postgresService.updateRelationship(id, updates);

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    res.json({ relationship });
  } catch (error) {
    console.error('Error updating relationship:', error);
    res.status(500).json({ error: error.message || 'Failed to update relationship' });
  }
});

/**
 * DELETE /api/relationships/:id
 * Delete a relationship
 */
router.delete('/relationships/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await postgresService.deleteRelationship(id);

    res.json({ success: true, message: 'Relationship deleted' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

export default router;

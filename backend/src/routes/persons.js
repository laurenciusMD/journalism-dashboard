/**
 * Person Routes - CRUD operations for persons in investigations
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

function requireDossierAccess(req, res, next) {
  // TODO: Implement proper authorization check
  // For now, just check authentication
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ===== PERSON ROUTES =====

/**
 * GET /api/persons?dossier_id=...&search=...&limit=...&offset=...
 * List persons with optional filtering
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { dossier_id, search, limit, offset } = req.query;

    const persons = await postgresService.listPersons({
      dossier_id,
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
 * GET /api/persons/:id
 * Get a single person by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const person = await postgresService.getPerson(id);

    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json({ person });
  } catch (error) {
    console.error('Error getting person:', error);
    res.status(500).json({ error: 'Failed to get person' });
  }
});

/**
 * POST /api/persons
 * Create a new person
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { dossier_id, canonical_name, aliases, description, confidence_score } = req.body;

    if (!dossier_id || !canonical_name) {
      return res.status(400).json({ error: 'dossier_id and canonical_name are required' });
    }

    // Verify dossier exists and user has access
    const dossier = await postgresService.getDossier(dossier_id);
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier not found' });
    }

    const person = await postgresService.createPerson({
      dossier_id,
      canonical_name,
      aliases: aliases || [],
      description,
      confidence_score: confidence_score !== undefined ? confidence_score : 0.5
    });

    res.status(201).json({ person });
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

/**
 * PATCH /api/persons/:id
 * Update a person
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify person exists
    const person = await postgresService.getPerson(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const updatedPerson = await postgresService.updatePerson(id, updates);

    res.json({ person: updatedPerson });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: error.message || 'Failed to update person' });
  }
});

/**
 * DELETE /api/persons/:id
 * Delete a person
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify person exists
    const person = await postgresService.getPerson(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    await postgresService.deletePerson(id);

    res.json({ success: true, message: 'Person deleted' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

/**
 * POST /api/persons/:id/merge
 * Merge another person into this one
 */
router.post('/:id/merge', requireAuth, async (req, res) => {
  try {
    const { id: primary_person_id } = req.params;
    const { merged_person_id, reason } = req.body;

    if (!merged_person_id) {
      return res.status(400).json({ error: 'merged_person_id is required' });
    }

    if (primary_person_id === merged_person_id) {
      return res.status(400).json({ error: 'Cannot merge a person with itself' });
    }

    // Verify both persons exist
    const primaryPerson = await postgresService.getPerson(primary_person_id);
    const mergedPerson = await postgresService.getPerson(merged_person_id);

    if (!primaryPerson || !mergedPerson) {
      return res.status(404).json({ error: 'One or both persons not found' });
    }

    const result = await postgresService.mergePerson({
      primary_person_id,
      merged_person_id,
      reason,
      merged_by: req.session.userId,
      dossier_id: primaryPerson.dossier_id
    });

    res.json(result);
  } catch (error) {
    console.error('Error merging persons:', error);
    res.status(500).json({ error: error.message || 'Failed to merge persons' });
  }
});

/**
 * GET /api/persons/:id/timeline
 * Get timeline of all events/attributes for a person
 */
router.get('/:id/timeline', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const person = await postgresService.getPerson(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const events = [];

    // Get attributes with dates
    const attributes = await postgresService.listAttributes({ person_id: id });
    attributes
      .filter(attr => attr.valid_from || attr.valid_to)
      .forEach(attr => {
        events.push({
          id: `attr_${attr.id}`,
          type: 'attribute',
          title: `${attr.attribute_type}: ${attr.attribute_value}`,
          date: attr.valid_from || attr.created_at,
          details: attr
        });
      });

    // Get relationships
    const relationships = await postgresService.listRelationships({ person_id: id });
    for (const rel of relationships) {
      if (rel.valid_from) {
        // Get the other person's name
        const otherPersonId = rel.person_a_id === id ? rel.person_b_id : rel.person_a_id;
        const otherPerson = await postgresService.getPerson(otherPersonId);

        events.push({
          id: `rel_${rel.id}`,
          type: 'relationship',
          title: `${rel.relationship_type} with ${otherPerson?.canonical_name || 'Unknown'}`,
          date: rel.valid_from,
          details: rel
        });
      }
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ events });
  } catch (error) {
    console.error('Error getting person timeline:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

// ===== PERSON ATTRIBUTE ROUTES =====

/**
 * GET /api/persons/:id/attributes
 * Get all attributes for a person
 */
router.get('/:id/attributes', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { attribute_type, verified } = req.query;

    const person = await postgresService.getPerson(id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const attributes = await postgresService.listAttributes({
      person_id: id,
      attribute_type,
      verified: verified !== undefined ? verified === 'true' : undefined
    });

    res.json({ attributes });
  } catch (error) {
    console.error('Error listing attributes:', error);
    res.status(500).json({ error: 'Failed to list attributes' });
  }
});

/**
 * POST /api/persons/:id/attributes
 * Add an attribute to a person
 */
router.post('/:id/attributes', requireAuth, async (req, res) => {
  try {
    const { id: person_id } = req.params;
    const {
      attribute_type,
      attribute_value,
      confidence_score,
      valid_from,
      valid_to,
      source_type,
      evidence_refs,
      notes,
      verified
    } = req.body;

    if (!attribute_type || !attribute_value) {
      return res.status(400).json({ error: 'attribute_type and attribute_value are required' });
    }

    const person = await postgresService.getPerson(person_id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const attribute = await postgresService.createAttribute({
      person_id,
      attribute_type,
      attribute_value,
      confidence_score,
      valid_from,
      valid_to,
      source_type,
      evidence_refs: evidence_refs || [],
      notes,
      created_by: req.session.userId,
      verified: verified || false
    });

    res.status(201).json({ attribute });
  } catch (error) {
    console.error('Error creating attribute:', error);
    res.status(500).json({ error: 'Failed to create attribute' });
  }
});

/**
 * PATCH /api/attributes/:id
 * Update an attribute
 */
router.patch('/attributes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const attribute = await postgresService.updateAttribute(id, updates);

    if (!attribute) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    res.json({ attribute });
  } catch (error) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ error: error.message || 'Failed to update attribute' });
  }
});

/**
 * DELETE /api/attributes/:id
 * Delete an attribute
 */
router.delete('/attributes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await postgresService.deleteAttribute(id);

    res.json({ success: true, message: 'Attribute deleted' });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ error: 'Failed to delete attribute' });
  }
});

export default router;

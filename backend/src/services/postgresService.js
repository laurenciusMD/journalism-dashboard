/**
 * PostgreSQL Database Service
 * Handles all database operations for the journalism investigation database
 */

import pkg from 'pg';
const { Pool } = pkg;

class PostgresService {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    if (this.pool) {
      return; // Already initialized
    }

    const connectionString = process.env.POSTGRES_URL || 'postgresql://journalism:journalism_password@localhost:5432/journalism';

    this.pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    } catch (error) {
      console.error('❌ PostgreSQL connection error:', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env.NODE_ENV !== 'production') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
      }

      return res;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool (for transactions)
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('PostgreSQL connections closed');
    }
  }

  // ===== DOSSIER OPERATIONS =====

  async createDossier({ title, description, status = 'active', created_by }) {
    const result = await this.query(
      `INSERT INTO dossiers (title, description, status, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, status, created_by]
    );
    return result.rows[0];
  }

  async getDossier(id) {
    const result = await this.query(
      'SELECT * FROM dossiers WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async listDossiers({ status, created_by, limit = 50, offset = 0 } = {}) {
    let query = 'SELECT * FROM dossiers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (created_by) {
      query += ` AND created_by = $${paramCount}`;
      params.push(created_by);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  async updateDossier(id, updates) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['title', 'description', 'status'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);

    const result = await this.query(
      `UPDATE dossiers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async deleteDossier(id) {
    await this.query('DELETE FROM dossiers WHERE id = $1', [id]);
  }

  // ===== PERSON OPERATIONS =====

  async createPerson({ dossier_id, canonical_name, aliases = [], description, confidence_score = 0.5 }) {
    const result = await this.query(
      `INSERT INTO persons (dossier_id, canonical_name, aliases, description, confidence_score)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dossier_id, canonical_name, aliases, description, confidence_score]
    );
    return result.rows[0];
  }

  async getPerson(id) {
    const result = await this.query(
      'SELECT * FROM persons WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async listPersons({ dossier_id, search, limit = 100, offset = 0 } = {}) {
    let query = 'SELECT * FROM persons WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (dossier_id) {
      query += ` AND dossier_id = $${paramCount}`;
      params.push(dossier_id);
      paramCount++;
    }

    if (search) {
      query += ` AND (canonical_name ILIKE $${paramCount} OR $${paramCount + 1} = ANY(aliases))`;
      params.push(`%${search}%`, search);
      paramCount += 2;
    }

    query += ' ORDER BY canonical_name ASC';
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  async updatePerson(id, updates) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['canonical_name', 'aliases', 'description', 'confidence_score'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);

    const result = await this.query(
      `UPDATE persons SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async deletePerson(id) {
    await this.query('DELETE FROM persons WHERE id = $1', [id]);
  }

  async mergePerson({ primary_person_id, merged_person_id, reason, merged_by, dossier_id }) {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      // Get the merged person's data
      const mergedResult = await client.query('SELECT * FROM persons WHERE id = $1', [merged_person_id]);
      const mergedPerson = mergedResult.rows[0];

      if (!mergedPerson) {
        throw new Error('Merged person not found');
      }

      // Update primary person's merged_from array
      await client.query(
        `UPDATE persons
         SET merged_from = array_append(COALESCE(merged_from, ARRAY[]::UUID[]), $1)
         WHERE id = $2`,
        [merged_person_id, primary_person_id]
      );

      // Transfer all attributes to primary person
      await client.query(
        'UPDATE person_attributes SET person_id = $1 WHERE person_id = $2',
        [primary_person_id, merged_person_id]
      );

      // Transfer all relationships
      await client.query(
        'UPDATE person_relationships SET person_a_id = $1 WHERE person_a_id = $2',
        [primary_person_id, merged_person_id]
      );
      await client.query(
        'UPDATE person_relationships SET person_b_id = $1 WHERE person_b_id = $2',
        [primary_person_id, merged_person_id]
      );

      // Transfer all media links
      await client.query(
        'UPDATE person_media SET person_id = $1 WHERE person_id = $2',
        [primary_person_id, merged_person_id]
      );

      // Log the merge
      await client.query(
        `INSERT INTO person_merge_log (dossier_id, primary_person_id, merged_person_id, reason, merged_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [dossier_id, primary_person_id, merged_person_id, reason, merged_by]
      );

      // Delete the merged person
      await client.query('DELETE FROM persons WHERE id = $1', [merged_person_id]);

      await client.query('COMMIT');

      return { success: true, primary_person_id, merged_person_id };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== PERSON ATTRIBUTE OPERATIONS =====

  async createAttribute({
    person_id,
    attribute_type,
    attribute_value,
    confidence_score = 0.5,
    valid_from,
    valid_to,
    source_type,
    evidence_refs = [],
    notes,
    created_by,
    verified = false
  }) {
    const result = await this.query(
      `INSERT INTO person_attributes
       (person_id, attribute_type, attribute_value, confidence_score, valid_from, valid_to,
        source_type, evidence_refs, notes, created_by, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [person_id, attribute_type, attribute_value, confidence_score, valid_from, valid_to,
       source_type, evidence_refs, notes, created_by, verified]
    );
    return result.rows[0];
  }

  async listAttributes({ person_id, attribute_type, verified } = {}) {
    let query = 'SELECT * FROM person_attributes WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (person_id) {
      query += ` AND person_id = $${paramCount}`;
      params.push(person_id);
      paramCount++;
    }

    if (attribute_type) {
      query += ` AND attribute_type = $${paramCount}`;
      params.push(attribute_type);
      paramCount++;
    }

    if (verified !== undefined) {
      query += ` AND verified = $${paramCount}`;
      params.push(verified);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.query(query, params);
    return result.rows;
  }

  async updateAttribute(id, updates) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    const allowedFields = ['attribute_value', 'confidence_score', 'valid_from', 'valid_to', 'notes', 'verified'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);

    const result = await this.query(
      `UPDATE person_attributes SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async deleteAttribute(id) {
    await this.query('DELETE FROM person_attributes WHERE id = $1', [id]);
  }

  // ===== PERSON RELATIONSHIP OPERATIONS =====

  async createRelationship({
    dossier_id,
    person_a_id,
    person_b_id,
    relationship_type,
    description,
    confidence_score = 0.5,
    evidence_refs = [],
    valid_from,
    valid_to
  }) {
    const result = await this.query(
      `INSERT INTO person_relationships
       (dossier_id, person_a_id, person_b_id, relationship_type, description,
        confidence_score, evidence_refs, valid_from, valid_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [dossier_id, person_a_id, person_b_id, relationship_type, description,
       confidence_score, evidence_refs, valid_from, valid_to]
    );
    return result.rows[0];
  }

  async listRelationships({ dossier_id, person_id, relationship_type } = {}) {
    let query = 'SELECT * FROM person_relationships WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (dossier_id) {
      query += ` AND dossier_id = $${paramCount}`;
      params.push(dossier_id);
      paramCount++;
    }

    if (person_id) {
      query += ` AND (person_a_id = $${paramCount} OR person_b_id = $${paramCount})`;
      params.push(person_id);
      paramCount++;
    }

    if (relationship_type) {
      query += ` AND relationship_type = $${paramCount}`;
      params.push(relationship_type);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.query(query, params);
    return result.rows;
  }

  async updateRelationship(id, updates) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    const allowedFields = ['relationship_type', 'description', 'confidence_score', 'valid_from', 'valid_to'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        params.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);

    const result = await this.query(
      `UPDATE person_relationships SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    return result.rows[0];
  }

  async deleteRelationship(id) {
    await this.query('DELETE FROM person_relationships WHERE id = $1', [id]);
  }

  // ===== STATS & ANALYTICS =====

  async getDossierStats(dossier_id) {
    const stats = {};

    // Person stats
    const personStats = await this.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN confidence_score >= 0.7 THEN 1 END) as high_confidence
       FROM persons WHERE dossier_id = $1`,
      [dossier_id]
    );
    stats.persons = personStats.rows[0];

    // Attribute stats
    const attrStats = await this.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified
       FROM person_attributes pa
       JOIN persons p ON p.id = pa.person_id
       WHERE p.dossier_id = $1`,
      [dossier_id]
    );
    stats.attributes = attrStats.rows[0];

    // Relationship stats
    const relStats = await this.query(
      `SELECT
        COUNT(*) as total,
        COUNT(DISTINCT relationship_type) as types,
        COUNT(CASE WHEN confidence_score >= 0.7 THEN 1 END) as confirmed
       FROM person_relationships WHERE dossier_id = $1`,
      [dossier_id]
    );
    stats.relationships = relStats.rows[0];

    return stats;
  }
}

// Export singleton instance
const postgresService = new PostgresService();
export default postgresService;

/**
 * Pure tests for the database-target safety guards.
 *
 * These encode the rule that destructive scripts/tests must fail closed on a
 * non-local or production-like MongoDB target, and must not treat a missing
 * NODE_ENV as proof of safety. No database is contacted.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertSafeLocalDevelopmentTarget,
  assertSafeTestTarget,
  isProductionLikeEnv,
  isTestDatabaseName,
  parseMongoTarget,
} from '../src/lib/db-target.js';

describe('parseMongoTarget', () => {
  it('parses a local mongodb URI into host and database', () => {
    const target = parseMongoTarget('mongodb://127.0.0.1:27017/campus_waste');
    assert.deepEqual(target, {
      protocol: 'mongodb:',
      host: '127.0.0.1',
      database: 'campus_waste',
      isLocal: true,
    });
  });

  it('recognises localhost and IPv6 loopback as local', () => {
    assert.equal(parseMongoTarget('mongodb://localhost:27017/db').isLocal, true);
    assert.equal(parseMongoTarget('mongodb://[::1]:27017/db').isLocal, true);
  });

  it('marks a remote host as non-local', () => {
    const target = parseMongoTarget('mongodb+srv://user:pass@cluster.example.net/campus_waste');
    assert.equal(target.isLocal, false);
    assert.equal(target.host, 'cluster.example.net');
  });

  it('rejects malformed, ambiguous and non-mongodb URIs', () => {
    assert.equal(parseMongoTarget('not a uri'), null);
    assert.equal(parseMongoTarget(''), null);
    assert.equal(parseMongoTarget(undefined), null);
    // Multiple hosts (a replica set) are never a single local dev target.
    assert.equal(parseMongoTarget('mongodb://h1:27017,h2:27017/db'), null);
    assert.equal(parseMongoTarget('postgres://127.0.0.1:5432/x'), null);
  });
});

describe('assertSafeLocalDevelopmentTarget', () => {
  const scriptName = 'test-script';

  it('accepts a local development database', () => {
    const target = assertSafeLocalDevelopmentTarget({
      uri: 'mongodb://127.0.0.1:27017/campus_waste',
      nodeEnv: 'development',
      scriptName,
    });
    assert.equal(target.database, 'campus_waste');
  });

  it('accepts a local target when NODE_ENV is unset (host proves safety)', () => {
    assert.doesNotThrow(() =>
      assertSafeLocalDevelopmentTarget({
        uri: 'mongodb://localhost:27017/campus_waste',
        nodeEnv: undefined,
        scriptName,
      }),
    );
  });

  it('rejects a non-local host even without NODE_ENV', () => {
    assert.throws(
      () =>
        assertSafeLocalDevelopmentTarget({
          uri: 'mongodb://db.prod.example.net:27017/campus_waste',
          nodeEnv: undefined,
          scriptName,
        }),
      /not local/,
    );
  });

  it('rejects a production-like NODE_ENV', () => {
    for (const nodeEnv of ['production', 'prod', 'Production', 'staging', 'pre-prod']) {
      assert.throws(
        () =>
          assertSafeLocalDevelopmentTarget({
            uri: 'mongodb://127.0.0.1:27017/campus_waste',
            nodeEnv,
            scriptName,
          }),
        /production-like/,
        `expected NODE_ENV=${nodeEnv} to be refused`,
      );
    }
  });

  it('rejects a production-like database name', () => {
    assert.throws(
      () =>
        assertSafeLocalDevelopmentTarget({
          uri: 'mongodb://127.0.0.1:27017/campus_waste_prod',
          nodeEnv: 'development',
          scriptName,
        }),
      /production-like/,
    );
  });

  it('rejects a malformed or multi-host URI', () => {
    for (const uri of ['', 'nonsense', 'mongodb://h1:27017,h2:27017/db', 'mongodb://127.0.0.1:27017']) {
      assert.throws(
        () => assertSafeLocalDevelopmentTarget({ uri, nodeEnv: 'development', scriptName }),
        (err) => Array.isArray(err.reasons) && err.reasons.length > 0,
        `expected ${JSON.stringify(uri)} to be refused`,
      );
    }
  });
});

describe('assertSafeTestTarget', () => {
  it('accepts the default campus_waste_test database', () => {
    const target = assertSafeTestTarget({
      uri: 'mongodb://127.0.0.1:27017/campus_waste_test',
      nodeEnv: 'test',
    });
    assert.equal(target.database, 'campus_waste_test');
  });

  it('rejects the application database used by the dev seed', () => {
    assert.throws(
      () =>
        assertSafeTestTarget({
          uri: 'mongodb://127.0.0.1:27017/campus_waste',
          nodeEnv: 'development',
        }),
      /not test-only/,
    );
  });

  it('rejects a remote host even when the name ends in _test', () => {
    assert.throws(
      () =>
        assertSafeTestTarget({
          uri: 'mongodb://db.example.net:27017/campus_waste_test',
          nodeEnv: 'test',
        }),
      /not local/,
    );
  });

  it('rejects a production-like NODE_ENV', () => {
    assert.throws(
      () =>
        assertSafeTestTarget({
          uri: 'mongodb://127.0.0.1:27017/campus_waste_test',
          nodeEnv: 'production',
        }),
      /production-like/,
    );
  });
});

describe('environment and database-name predicates', () => {
  it('flag production-like environment names only', () => {
    for (const value of ['production', 'prod', 'PROD', 'staging', 'uat', 'qa']) {
      assert.equal(isProductionLikeEnv(value), true, value);
    }
    for (const value of ['development', 'test', 'dev', 'local', '']) {
      assert.equal(isProductionLikeEnv(value), false, value);
    }
  });

  it('accept only _test / _tests database suffixes', () => {
    assert.equal(isTestDatabaseName('campus_waste_test'), true);
    assert.equal(isTestDatabaseName('campus_waste_tests'), true);
    assert.equal(isTestDatabaseName('campus_waste'), false);
    assert.equal(isTestDatabaseName('contest'), false);
    assert.equal(isTestDatabaseName(''), false);
  });
});

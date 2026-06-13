import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server/app";

const JWT_SECRET = process.env.JWT_SECRET || "smartpass-super-secret-key-2026";

describe("Integrated API Suite Tests", () => {
  let validToken: string;

  before(() => {
    // Generate valid test JWT token for authorization
    validToken = jwt.sign(
      { userId: "demo-user-selim", email: "selim@smartpass.co" },
      JWT_SECRET
    );
  });

  // 1. /api/passenger/dashboard Integration Tests
  test("GET /api/passenger/dashboard - Rejects requests without JWT Token (401)", async () => {
    const res = await request(app)
      .get("/api/passenger/dashboard")
      .expect(401);

    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, "UNAUTHORIZED");
  });

  test("GET /api/passenger/dashboard - Rejects requests with malformed JWT Token (401)", async () => {
    const res = await request(app)
      .get("/api/passenger/dashboard")
      .set("Authorization", "Bearer invalid-token-value")
      .expect(401);

    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, "INVALID_TOKEN");
  });

  test("GET /api/passenger/dashboard - Serves combined BFF dashboard with valid authorization (200)", async () => {
    const res = await request(app)
      .get("/api/passenger/dashboard")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.user);
    assert.ok(res.body.flight);
    assert.strictEqual(res.body.user.id, "demo-user-selim");
    assert.ok(res.body.currency);
  });

  // 2. Weather Route Endpoints Tests
  test("GET /api/weather/info - Returns weather data for standard queries with defaults", async () => {
    const res = await request(app)
      .get("/api/weather/info")
      .expect(200);

    assert.ok(res.body.departure);
    assert.ok(res.body.arrival);
    assert.strictEqual(res.body.departure.code, "IST");
    assert.strictEqual(res.body.arrival.code, "LHR");
  });

  test("GET /api/weather/info - Returns weather details for custom query parameters", async () => {
    const res = await request(app)
      .get("/api/weather/info?from=SAW&fromCity=Istanbul&to=ADB&toCity=Izmir")
      .expect(200);

    assert.ok(res.body.departure);
    assert.ok(res.body.arrival);
    assert.strictEqual(res.body.departure.code, "SAW");
    assert.strictEqual(res.body.arrival.code, "ADB");
    assert.ok(typeof res.body.departure.temp === "number");
  });

  // 3. Simulation Production Security Lock Tests
  describe("Simulation Production Environment Lock Rules", () => {
    let originalNodeEnv: string | undefined;
    let originalSimApiKey: string | undefined;

    before(() => {
      originalNodeEnv = process.env.NODE_ENV;
      originalSimApiKey = process.env.SIMULATION_API_KEY;
    });

    after(() => {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.SIMULATION_API_KEY = originalSimApiKey;
    });

    test("POST /api/simulation/update - Safely permits arbitrary updates in non-production environments", async () => {
      process.env.NODE_ENV = "test";
      
      const res = await request(app)
        .post("/api/simulation/update")
        .send({ gate: "A-55" })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.variables.gate, "A-55");
    });

    test("GET /api/simulation/state - Safely permits fetching state in non-production environments", async () => {
      process.env.NODE_ENV = "test";
      
      const res = await request(app)
        .get("/api/simulation/state")
        .expect(200);

      assert.ok(res.body.flightNumber);
    });

    test("GET /api/simulation/state - Blocks simulation state read in production without valid SIMULATION_API_KEY (403)", async () => {
      process.env.NODE_ENV = "production";
      process.env.SIMULATION_API_KEY = "prod-secret-access-key-13579";

      const res = await request(app)
        .get("/api/simulation/state")
        .expect(403);

      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.code, "FORBIDDEN");
    });

    test("GET /api/simulation/state - Permits simulation state read under production with valid administrative key (200)", async () => {
      process.env.NODE_ENV = "production";
      process.env.SIMULATION_API_KEY = "prod-secret-access-key-13579";

      const res = await request(app)
        .get("/api/simulation/state")
        .set("x-simulation-api-key", "prod-secret-access-key-13579")
        .expect(200);

      assert.ok(res.body.flightNumber);
    });

    test("POST /api/simulation/update - Absolutely blocks simulation updates in production without valid SIMULATION_API_KEY (403)", async () => {
      process.env.NODE_ENV = "production";
      process.env.SIMULATION_API_KEY = "prod-secret-access-key-13579";

      const res = await request(app)
        .post("/api/simulation/update")
        .send({ gate: "B-22" })
        .expect(403);

      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.code, "FORBIDDEN");
      assert.ok(res.body.message.includes("Simulation update endpoints are disabled"));
    });

    test("POST /api/simulation/update - Permits simulation updates under production with valid administrative x-simulation-api-key header (200)", async () => {
      process.env.NODE_ENV = "production";
      process.env.SIMULATION_API_KEY = "prod-secret-access-key-13579";

      const res = await request(app)
        .post("/api/simulation/update")
        .set("x-simulation-api-key", "prod-secret-access-key-13579")
        .send({ gate: "B-33" })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.variables.gate, "B-33");
    });
  });
});

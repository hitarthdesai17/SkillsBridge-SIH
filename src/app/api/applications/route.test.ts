import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { clearMemoryTrackerStore } from '@/lib/application_tracking_engine';

describe('Phase 7.1: Application Tracking API Endpoint (/api/applications)', () => {

  beforeEach(() => {
    clearMemoryTrackerStore();
  });

  it('TEST 1: GET /api/applications returns empty list initially', async () => {
    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(0);
    expect(data.applications).toEqual([]);
  });

  it('TEST 2: POST /api/applications (CREATE) saves opportunity and returns tracking item', async () => {
    const request = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        opportunity_id: 'opp_python_backend_09',
        notes: 'Targeting backend internship application'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.item).toBeDefined();
    expect(data.item.opportunity_id).toBe('opp_python_backend_09');
    expect(data.item.stage).toBe('SAVED');
    expect(data.item.notes).toBe('Targeting backend internship application');
    expect(data.item.status_history.length).toBe(1);
  });

  it('TEST 3: POST /api/applications (TRANSITION) executes valid stage transition', async () => {
    // 1. Create item
    const createReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        opportunity_id: 'opp_data_analyst_intern_01'
      })
    });
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const trackingId = createData.item.id;

    // 2. Transition to PREPARING
    const transReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSITION',
        tracking_id: trackingId,
        stage: 'PREPARING',
        notes: 'Updated resume with SQL projects'
      })
    });
    const transRes = await POST(transReq);
    const transData = await transRes.json();

    expect(transRes.status).toBe(200);
    expect(transData.success).toBe(true);
    expect(transData.item.stage).toBe('PREPARING');
    expect(transData.item.status_history.length).toBe(2);
  });

  it('TEST 4: POST /api/applications (TRANSITION) rejects invalid stage transition with 400', async () => {
    // 1. Create item
    const createReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        opportunity_id: 'opp_data_analyst_intern_01'
      })
    });
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const trackingId = createData.item.id;

    // 2. Attempt illegal transition SAVED -> OFFER
    const transReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSITION',
        tracking_id: trackingId,
        stage: 'OFFER'
      })
    });
    const transRes = await POST(transReq);
    const transData = await transRes.json();

    expect(transRes.status).toBe(400);
    expect(transData.success).toBe(false);
    expect(transData.error).toContain("Invalid stage transition from 'SAVED' to 'OFFER'");
  });

  it('TEST 5: POST /api/applications (DELETE) removes item from tracker', async () => {
    // 1. Create item
    const createReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        opportunity_id: 'opp_bi_intern_02'
      })
    });
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const trackingId = createData.item.id;

    // 2. Delete item
    const deleteReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE',
        tracking_id: trackingId
      })
    });
    const deleteRes = await POST(deleteReq);
    const deleteData = await deleteRes.json();

    expect(deleteRes.status).toBe(200);
    expect(deleteData.success).toBe(true);

    // 3. Verify empty list
    const getRes = await GET(new Request('http://localhost:3000/api/applications'));
    const getData = await getRes.json();
    expect(getData.count).toBe(0);
  });

  it('TEST 6: POST /api/applications (TRANSITION) strictly rejects APPLIED -> OFFER with 400 and preserves stage invariant', async () => {
    // 1. Create item in SAVED
    const createReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        opportunity_id: 'opp_python_backend_09'
      })
    });
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const trackingId = createData.item.id;

    // 2. Transition SAVED -> APPLIED
    const appliedReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSITION',
        tracking_id: trackingId,
        stage: 'APPLIED'
      })
    });
    const appliedRes = await POST(appliedReq);
    const appliedData = await appliedRes.json();
    expect(appliedRes.status).toBe(200);
    expect(appliedData.item.stage).toBe('APPLIED');
    const historyLengthBefore = appliedData.item.status_history.length;

    // 3. Attempt illegal transition APPLIED -> OFFER
    const offerReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSITION',
        tracking_id: trackingId,
        stage: 'OFFER'
      })
    });
    const offerRes = await POST(offerReq);
    const offerData = await offerRes.json();

    expect(offerRes.status).toBe(400);
    expect(offerData.success).toBe(false);
    expect(offerData.error).toContain("Invalid stage transition from 'APPLIED' to 'OFFER'");

    // 4. Verify stage in store remains APPLIED with unchanged history length
    const getRes = await GET(new Request('http://localhost:3000/api/applications'));
    const getData = await getRes.json();
    const itemInStore = getData.applications.find((a: any) => a.id === trackingId);
    expect(itemInStore).toBeDefined();
    expect(itemInStore.stage).toBe('APPLIED');
    expect(itemInStore.status_history.length).toBe(historyLengthBefore);
  });

  it('TEST 7: POST /api/applications (TRANSITION) rejects SAVED -> INTERVIEWING and SAVED -> REJECTED', async () => {
    const createReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE',
        opportunity_id: 'opp_python_backend_09'
      })
    });
    const createRes = await POST(createReq);
    const createData = await createRes.json();
    const trackingId = createData.item.id;

    // SAVED -> INTERVIEWING
    const intRes = await POST(new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSITION',
        tracking_id: trackingId,
        stage: 'INTERVIEWING'
      })
    }));
    const intData = await intRes.json();
    expect(intRes.status).toBe(400);
    expect(intData.success).toBe(false);
    expect(intData.error).toContain("Invalid stage transition from 'SAVED' to 'INTERVIEWING'");

    // SAVED -> REJECTED
    const rejRes = await POST(new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TRANSITION',
        tracking_id: trackingId,
        stage: 'REJECTED'
      })
    }));
    const rejData = await rejRes.json();
    expect(rejRes.status).toBe(400);
    expect(rejData.success).toBe(false);
    expect(rejData.error).toContain("Invalid stage transition from 'SAVED' to 'REJECTED'");
  });

});

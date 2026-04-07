import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Device Registration Module', () => {
  it('should allow security staff to register and block a device', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: securityToken } = await createAndLogin(app, 'security');

    const register = await request(app)
      .post('/api/devices/register')
      .set(authHeader(securityToken))
      .send({
        studentId: student.studentId,
        phoneNumber: '555-0100',
        deviceType: 'laptop',
        brand: 'Dell',
        model: 'XPS',
        serialNumber: 'SN-123',
        macAddress: 'AA:BB:CC:DD:EE:FF'
      });

    expect(register.status).toBe(201);
    const deviceId = register.body.data.device._id;

    const block = await request(app)
      .patch(`/api/devices/${deviceId}/block`)
      .set(authHeader(securityToken))
      .send({ remarks: 'Policy violation' });

    expect(block.status).toBe(200);
  });

  it('should allow security staff to view registered devices', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: securityToken } = await createAndLogin(app, 'security');

    await request(app)
      .post('/api/devices/register')
      .set(authHeader(securityToken))
      .send({
        studentId: student.studentId,
        phoneNumber: '555-0101',
        deviceType: 'tablet',
        brand: 'Apple',
        model: 'iPhone',
        serialNumber: 'SN-456',
        macAddress: '11:22:33:44:55:66'
      });

    const devices = await request(app)
      .get('/api/devices')
      .set(authHeader(securityToken));

    expect(devices.status).toBe(200);
    expect(devices.body.data.devices.length).toBe(1);
  });

  it('should prevent students from registering devices', async () => {
    const { token: studentToken, user: student } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/devices/register')
      .set(authHeader(studentToken))
      .send({
        studentId: student.studentId,
        phoneNumber: '555-0102',
        deviceType: 'tablet',
        brand: 'Samsung',
        model: 'Tab',
        serialNumber: 'SN-789',
        macAddress: 'AA:11:BB:22:CC:33'
      });

    expect(response.status).toBe(403);
  });
});

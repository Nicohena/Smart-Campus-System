import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader, loginUser } from './helpers/testUtils';

describe('Device Registration Module', () => {
  it('should allow staff to register and block a device', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: staffToken } = await createAndLogin(app, 'staff');

    const register = await request(app)
      .post('/api/devices/register')
      .set(authHeader(staffToken))
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
      .set(authHeader(staffToken))
      .send({ remarks: 'Policy violation' });

    expect(block.status).toBe(200);
  });

  it('should allow student to view registered devices', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: staffToken } = await createAndLogin(app, 'staff');
    const studentToken = await loginUser(app, student.email, 'Password123!');

    await request(app)
      .post('/api/devices/register')
      .set(authHeader(staffToken))
      .send({
        studentId: student.studentId,
        phoneNumber: '555-0101',
        deviceType: 'phone',
        brand: 'Apple',
        model: 'iPhone',
        serialNumber: 'SN-456',
        macAddress: '11:22:33:44:55:66'
      });

    const myDevices = await request(app)
      .get('/api/devices/my')
      .set(authHeader(studentToken));

    expect(myDevices.status).toBe(200);
    expect(myDevices.body.data.devices.length).toBe(1);
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

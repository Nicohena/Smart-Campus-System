import { Request, Response } from 'express';
import CampusLocation from '../models/CampusLocation';
import { sendSuccess, sendError } from '../utils/response';

// POST /api/navigation
// Staff/admin create a campus location
export const createLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      category,
      building,
      floor,
      roomNumber,
      latitude,
      longitude,
      contactPerson,
      contactPhone,
      openHours
    } = req.body as {
      name?: string;
      description?: string;
      category?: string;
      building?: string;
      floor?: number;
      roomNumber?: string;
      latitude?: number;
      longitude?: number;
      contactPerson?: string;
      contactPhone?: string;
      openHours?: string;
    };

    if (!name || !description || !category || !building || latitude == null || longitude == null) {
      sendError(res, 'Missing required location fields', 400);
      return;
    }

    const location = await CampusLocation.create({
      name: name.trim(),
      description: description.trim(),
      category,
      building: building.trim(),
      floor,
      roomNumber,
      latitude,
      longitude,
      contactPerson,
      contactPhone,
      openHours
    });

    sendSuccess(res, 'Location created', { location }, 201);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create location error:', error);
    sendError(res, 'Could not create location');
  }
};

// PATCH /api/navigation/:id
// Staff/admin update a campus location
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    const location = await CampusLocation.findById(id);
    if (!location) {
      sendError(res, 'Location not found', 404);
      return;
    }

    if (typeof updates.name === 'string') location.name = updates.name.trim();
    if (typeof updates.description === 'string') location.description = updates.description.trim();
    if (updates.category) location.category = updates.category as any;
    if (typeof updates.building === 'string') location.building = updates.building.trim();
    if (typeof updates.floor === 'number') location.floor = updates.floor;
    if (typeof updates.roomNumber === 'string') location.roomNumber = updates.roomNumber;
    if (typeof updates.latitude === 'number') location.latitude = updates.latitude;
    if (typeof updates.longitude === 'number') location.longitude = updates.longitude;
    if (typeof updates.contactPerson === 'string') location.contactPerson = updates.contactPerson.trim();
    if (typeof updates.contactPhone === 'string') location.contactPhone = updates.contactPhone.trim();
    if (typeof updates.openHours === 'string') location.openHours = updates.openHours.trim();

    await location.save();
    sendSuccess(res, 'Location updated', { location });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update location error:', error);
    sendError(res, 'Could not update location');
  }
};

// DELETE /api/navigation/:id
// Staff/admin delete a campus location
export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const location = await CampusLocation.findById(id);
    if (!location) {
      sendError(res, 'Location not found', 404);
      return;
    }

    await location.deleteOne();
    sendSuccess(res, 'Location deleted');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete location error:', error);
    sendError(res, 'Could not delete location');
  }
};

// GET /api/navigation
// Students view all locations
export const getAllLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await CampusLocation.find().sort({ name: 1 });
    sendSuccess(res, 'Locations fetched', { locations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get all locations error:', error);
    sendError(res, 'Could not fetch locations');
  }
};

// GET /api/navigation/search
// Students search by name or category
export const searchLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, building } = req.query as {
      q?: string;
      category?: string;
      building?: string;
    };
    const filters: Record<string, any>[] = [];

    if (q) {
      filters.push({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { building: { $regex: q, $options: 'i' } }
        ]
      });
    }
    if (category) {
      filters.push({ category });
    }
    if (building) {
      filters.push({ building: { $regex: building, $options: 'i' } });
    }

    const query = filters.length > 0 ? { $and: filters } : {};
    const locations = await CampusLocation.find(query).sort({ name: 1 });
    sendSuccess(res, 'Locations fetched', { locations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search locations error:', error);
    sendError(res, 'Could not search locations');
  }
};

// GET /api/navigation/:id
// Students view a location by id
export const getLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const location = await CampusLocation.findById(id);
    if (!location) {
      sendError(res, 'Location not found', 404);
      return;
    }

    sendSuccess(res, 'Location fetched', { location });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get location by id error:', error);
    sendError(res, 'Could not fetch location');
  }
};

// GET /api/navigation/category/:category
// Students view locations by category
export const getLocationsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const locations = await CampusLocation.find({ category }).sort({ name: 1 });
    sendSuccess(res, 'Locations fetched', { locations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get locations by category error:', error);
    sendError(res, 'Could not fetch locations');
  }
};

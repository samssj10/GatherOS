import { Router } from 'express';
import * as controller from '../controllers/attendeeController';
import { validate } from '../middlewares/validate';

export const attendeeRouter = Router();

attendeeRouter.get('/', validate({ query: controller.listAttendeesQuerySchema }), controller.listAttendees);
// Must be registered before '/:id' so "summary" is not parsed as an id.
attendeeRouter.get('/summary', controller.getAttendeeSummary);
attendeeRouter.get('/:id', validate({ params: controller.attendeeParamsSchema }), controller.getAttendee);
attendeeRouter.patch(
  '/:id',
  validate({ params: controller.attendeeParamsSchema, body: controller.updateAttendeeBodySchema }),
  controller.updateAttendee,
);

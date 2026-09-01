import { z } from 'zod'

export const newRequestSchema = z
  .object({
    requestedDate: z.string().min(1, 'Selecciona un viernes.'),
    departureTime: z.string().min(1, 'Selecciona una hora de salida.'),
    reason: z.string().max(500, 'El comentario no puede superar 500 caracteres.').optional(),
  })
  .refine((value) => new Date(`${value.requestedDate}T12:00:00`).getDay() === 5, {
    message: 'La fecha seleccionada debe ser viernes.',
    path: ['requestedDate'],
  })
  .refine((value) => value.departureTime >= '13:00' && value.departureTime < '15:00', {
    message: 'La hora propuesta debe estar entre 13:00 y antes de las 15:00.',
    path: ['departureTime'],
  })

export type NewRequestFormValues = z.infer<typeof newRequestSchema>

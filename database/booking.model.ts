import mongoose, { Document, Model, Schema } from 'mongoose';
import Event from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook to verify that the referenced event exists
bookingSchema.pre('save', async function () {
  const booking = this as IBooking;

  // Only validate eventId if it's new or modified
  if (booking.isModified('eventId')) {
    const eventExists = await Event.findById(booking.eventId);
    
    if (!eventExists) {
      throw new Error('Referenced event does not exist');
    }
  }
});

// Create compound index for common queries (event bookings by date)
bookingSchema.index({ eventId: 1, createdAt: -1 });

//Create index on email for user booking lookups
bookingSchema.index({ email: 1 });

// Prevent model recompilation during hot reloads in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

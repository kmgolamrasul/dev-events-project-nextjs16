import mongoose, { Document, Model, Schema } from 'mongoose';

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [1000, 'Title cannot exceed 1000 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    overview: {
      type: String,
      required: [true, 'Overview is required'],
      trim: true,
      maxlength: [500, 'Overview cannot exceed 500 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: ['online', 'offline', 'hybrid'],
      trim: true,
    },
    audience: {
      type: String,
      required: [true, 'Audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Agenda is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Agenda must contain at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Tags are required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Tags must contain at least one item',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Create unique index on slug for faster lookups
eventSchema.index({ slug: 1 }, { unique: true });

// Pre-save hook for slug generation, date normalization, and validation
eventSchema.pre('save', async function (next) {
  const event = this as IEvent;

  // Generate slug only if title is new or modified
  if (event.isModified('title')) {
    const baseSlug = event.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Check for slug uniqueness and handle collisions
    let uniqueSlug = baseSlug;
    let suffix = 1;
    let isUnique = false;

    while (!isUnique) {
      // Check if slug exists, excluding current document when updating
      const query: any = { slug: uniqueSlug };
      if (event._id) {
        query._id = { $ne: event._id };
      }

      const existingEvent = await Event.findOne(query);
      
      if (!existingEvent) {
        isUnique = true;
        event.slug = uniqueSlug;
      } else {
        uniqueSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }
    }
  }

  // Normalize date to ISO format if modified
  if (event.isModified('date')) {
    try {
      const parsedDate = new Date(event.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      // Store as ISO date string (YYYY-MM-DD)
      event.date = parsedDate.toISOString().split('T')[0];
    } catch (error) {
      return next(new Error('Date must be in a valid format (e.g., YYYY-MM-DD)'));
    }
  }

  // Normalize time to HH:MM format if modified
  if (event.isModified('time')) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(event.time)) {
      return next(new Error('Time must be in HH:MM format (e.g., 14:30)'));
    }
  }

  next();
});

// Prevent model recompilation during hot reloads in development
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);

export default Event;

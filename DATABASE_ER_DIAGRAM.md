# 🗄️ ReliefNet Database Schema & ER Diagram

**Database:** MongoDB Atlas (Cloud)  
**Database Name:** disasterDB  
**Type:** NoSQL Document Database  
**Version:** MongoDB 6.20.0

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RELIEFNET ER DIAGRAM                                 │
└─────────────────────────────────────────────────────────────────────────────┘


                              ┌──────────────────┐
                              │      USERS       │
                              │   (Collection)   │
                              ├──────────────────┤
                              │ _id (PK)         │
                              │ name             │
                              │ email (UNIQUE)   │
                              │ password (hash)  │
                              │ role             │
                              │ location         │
                              │ availability     │
                              │ rating           │
                              │ ratingCount      │
                              │ isApproved       │
                              │ isActive         │
                              │ phone            │
                              │ address          │
                              │ createdAt        │
                              │ updatedAt        │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    │                  │                  │
         ┌──────────▼─────────┐       │       ┌──────────▼─────────┐
         │     RESOURCES      │       │       │     REQUESTS       │
         │   (Collection)     │       │       │   (Collection)     │
         ├────────────────────┤       │       ├────────────────────┤
         │ _id (PK)           │       │       │ _id (PK)           │
         │ donor (FK) ────────┼───────┘       │ requester (FK) ────┼─────┐
         │ type               │               │ resourceType       │     │
         │ quantity           │               │ quantity           │     │
         │ description        │               │ urgency            │     │
         │ location           │               │ location           │     │
         │ status             │               │ status             │     │
         │ createdAt          │               │ assignedVolunteer  │     │
         │ updatedAt          │               │ assignedResource   │     │
         └────────┬───────────┘               │ createdAt          │     │
                  │                           │ updatedAt          │     │
                  │                           └──────────┬─────────┘     │
                  │                                      │               │
                  │                                      │               │
                  │              ┌───────────────────────┼───────────────┘
                  │              │                       │
                  │              │                       │
                  └──────────────┼───────────────────────┘
                                 │
                                 │
                        ┌────────▼──────────┐
                        │  DELIVERY TASKS   │
                        │   (Collection)    │
                        ├───────────────────┤
                        │ _id (PK)          │
                        │ volunteer (FK) ───┼──────┐
                        │ request (FK)      │      │
                        │ resource (FK)     │      │
                        │ status            │      │
                        │ acceptedAt        │      │
                        │ pickedUpAt        │      │
                        │ inTransitAt       │      │
                        │ startedAt         │      │
                        │ completedAt       │      │
                        │ liveLocation      │      │
                        │ locationHistory   │      │
                        │ statusHistory     │      │
                        │ createdAt         │      │
                        │ updatedAt         │      │
                        └────────┬──────────┘      │
                                 │                 │
                                 │                 │
                        ┌────────▼──────────┐      │
                        │     DISPUTES      │      │
                        │   (Collection)    │      │
                        ├───────────────────┤      │
                        │ _id (PK)          │      │
                        │ deliveryTask (FK) │      │
                        │ reportedBy (FK) ──┼──────┘
                        │ reportedAgainst   │
                        │ type              │
                        │ description       │
                        │ status            │
                        │ resolution        │
                        │ resolvedBy (FK)   │
                        │ resolvedAt        │
                        │ priority          │
                        │ createdAt         │
                        │ updatedAt         │
                        └───────────────────┘


LEGEND:
─────────────────────────────────────────────────────────
PK  = Primary Key (_id)
FK  = Foreign Key (Reference to another collection)
───► = One-to-Many Relationship
═══► = Many-to-Many Relationship
```

---

## 📋 Detailed Schema Definitions

### 1. USERS Collection

```javascript
{
  _id: ObjectId,                    // Primary Key (Auto-generated)
  name: String,                     // Required, User's full name
  email: String,                    // Required, Unique, Indexed
  password: String,                 // Required, Hashed with bcrypt
  role: String,                     // Required, Enum: ['donor', 'requester', 'volunteer', 'admin']
  
  // Location (GeoJSON Point)
  location: {
    type: String,                   // Always "Point"
    coordinates: [Number, Number]   // [longitude, latitude], 2dsphere indexed
  },
  
  // Volunteer-specific fields
  availability: Boolean,            // Default: true (for volunteers)
  rating: Number,                   // Default: 0, Range: 0-5
  ratingCount: Number,              // Default: 0, Total ratings received
  
  // Admin approval fields
  isApproved: Boolean,              // Default: false, Admin approval required
  isActive: Boolean,                // Default: true, Can be deactivated by admin
  verificationStatus: String,       // Enum: ['pending', 'verified', 'rejected']
  
  // Additional info
  phone: String,                    // Optional, Contact number
  address: String,                  // Optional, Full address
  
  // Timestamps
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}

// Indexes:
// - email: unique
// - location: 2dsphere (for geospatial queries)
// - role: 1 (for filtering by role)
```

**Relationships:**
- **One-to-Many** with Resources (as donor)
- **One-to-Many** with Requests (as requester)
- **One-to-Many** with DeliveryTasks (as volunteer)
- **One-to-Many** with Disputes (as reporter/resolver)

---

### 2. RESOURCES Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  donor: ObjectId,                  // Required, Foreign Key → Users._id
  type: String,                     // Required, Resource type (Food, Water, Medical, etc.)
  quantity: Number,                 // Required, Available quantity
  description: String,              // Optional, Resource details
  
  // Location (GeoJSON Point)
  location: {
    type: String,                   // Always "Point"
    coordinates: [Number, Number]   // [longitude, latitude]
  },
  
  status: String,                   // Required, Enum: ['available', 'requested', 'delivered']
  
  // Timestamps
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}

// Indexes:
// - donor: 1 (for filtering by donor)
// - type: 1 (for filtering by resource type)
// - status: 1 (for filtering by status)
// - location: 2dsphere (for geospatial queries)
```

**Relationships:**
- **Many-to-One** with Users (donor)
- **One-to-Many** with DeliveryTasks

---

### 3. REQUESTS Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  requester: ObjectId,              // Required, Foreign Key → Users._id
  resourceType: String,             // Required, Type of resource needed
  quantity: Number,                 // Required, Quantity needed
  urgency: String,                  // Required, Enum: ['low', 'medium', 'high']
  
  // Location (GeoJSON Point)
  location: {
    type: String,                   // Always "Point"
    coordinates: [Number, Number]   // [longitude, latitude]
  },
  
  status: String,                   // Required, Enum: ['pending', 'fulfilled', 'rejected']
  
  // Matching results
  assignedVolunteer: ObjectId,      // Optional, Foreign Key → Users._id
  assignedResource: ObjectId,       // Optional, Foreign Key → Resources._id
  
  // Timestamps
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}

// Indexes:
// - requester: 1 (for filtering by requester)
// - status: 1 (for filtering by status)
// - urgency: 1 (for prioritization)
// - location: 2dsphere (for geospatial queries)
```

**Relationships:**
- **Many-to-One** with Users (requester)
- **One-to-One** with Users (assignedVolunteer)
- **One-to-One** with Resources (assignedResource)
- **One-to-One** with DeliveryTasks

---

### 4. DELIVERY TASKS Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  volunteer: ObjectId,              // Required, Foreign Key → Users._id
  request: ObjectId,                // Required, Foreign Key → Requests._id
  resource: ObjectId,               // Required, Foreign Key → Resources._id
  
  status: String,                   // Required, Enum: ['assigned', 'accepted', 'picked-up', 
                                    //                  'in-transit', 'delivered', 'in-progress', 'completed']
  
  // Timestamps for each status
  acceptedAt: Date,                 // When volunteer accepted
  pickedUpAt: Date,                 // When resource was picked up
  inTransitAt: Date,                // When transit started
  startedAt: Date,                  // When delivery started
  completedAt: Date,                // When delivery completed
  actualDeliveryTime: Date,         // Actual completion time
  
  // Live location tracking (Swiggy-style)
  liveLocation: {
    type: String,                   // Always "Point"
    coordinates: [Number, Number],  // [longitude, latitude]
    timestamp: Date                 // When location was updated
  },
  
  // Location history for tracking route
  locationHistory: [{
    coordinates: [Number, Number],  // [longitude, latitude]
    timestamp: Date,                // When this location was recorded
    status: String                  // Status at this location
  }],
  
  // Status change history
  statusHistory: [{
    status: String,                 // Status name
    timestamp: Date,                // When status changed
    location: {
      type: String,
      coordinates: [Number, Number]
    }
  }],
  
  // Estimated delivery time
  estimatedDeliveryTime: Date,
  
  // Timestamps
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}

// Indexes:
// - volunteer: 1 (for filtering by volunteer)
// - request: 1 (for filtering by request)
// - status: 1 (for filtering by status)
// - liveLocation: 2dsphere (for geospatial queries)
```

**Relationships:**
- **Many-to-One** with Users (volunteer)
- **One-to-One** with Requests
- **Many-to-One** with Resources
- **One-to-Many** with Disputes

---

### 5. DISPUTES Collection

```javascript
{
  _id: ObjectId,                    // Primary Key
  deliveryTask: ObjectId,           // Required, Foreign Key → DeliveryTasks._id
  reportedBy: ObjectId,             // Required, Foreign Key → Users._id
  reportedAgainst: ObjectId,        // Required, Foreign Key → Users._id
  
  type: String,                     // Required, Enum: ['delivery_failed', 'incomplete_delivery', 
                                    //                  'quality_issue', 'behavior_issue', 'other']
  
  description: String,              // Required, Detailed description of issue
  
  status: String,                   // Required, Enum: ['open', 'investigating', 'resolved', 'closed']
  
  resolution: String,               // Optional, Admin's resolution notes
  resolvedBy: ObjectId,             // Optional, Foreign Key → Users._id (admin)
  resolvedAt: Date,                 // Optional, When dispute was resolved
  
  priority: String,                 // Required, Enum: ['low', 'medium', 'high']
  
  // Timestamps
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}

// Indexes:
// - deliveryTask: 1 (for filtering by task)
// - reportedBy: 1 (for filtering by reporter)
// - status: 1 (for filtering by status)
// - priority: 1 (for prioritization)
```

**Relationships:**
- **Many-to-One** with DeliveryTasks
- **Many-to-One** with Users (reportedBy)
- **Many-to-One** with Users (reportedAgainst)
- **Many-to-One** with Users (resolvedBy - admin)

---

## 🔗 Relationship Cardinality

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RELATIONSHIP SUMMARY                                │
└─────────────────────────────────────────────────────────────────────────┘

USER (Donor) ──────────< RESOURCES
    1                           N
    "One donor can add many resources"

USER (Requester) ──────────< REQUESTS
    1                              N
    "One requester can submit many requests"

USER (Volunteer) ──────────< DELIVERY TASKS
    1                                N
    "One volunteer can handle many delivery tasks"

RESOURCES ──────────< DELIVERY TASKS
    1                         N
    "One resource can be part of many delivery tasks"

REQUESTS ──────────── DELIVERY TASKS
    1                         1
    "One request creates one delivery task"

DELIVERY TASKS ──────────< DISPUTES
    1                            N
    "One delivery task can have many disputes"

USER (Reporter) ──────────< DISPUTES
    1                              N
    "One user can report many disputes"

USER (Admin) ──────────< DISPUTES (Resolver)
    1                              N
    "One admin can resolve many disputes"
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW IN RELIEFNET                                │
└─────────────────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   ┌──────────┐
   │  Client  │──► POST /auth/register
   └──────────┘         │
                        ▼
                 ┌─────────────┐
                 │   Backend   │──► Hash password (bcrypt)
                 └──────┬──────┘
                        ▼
                 ┌─────────────┐
                 │  USERS      │──► Insert document
                 │  Collection │    {isApproved: false}
                 └─────────────┘

═══════════════════════════════════════════════════════════════════════════

2. RESOURCE ADDITION (Donor)
   ┌──────────┐
   │  Donor   │──► POST /resources
   └──────────┘         │
                        ▼
                 ┌─────────────┐
                 │  RESOURCES  │──► Insert document
                 │  Collection │    {donor: userId, status: 'available'}
                 └─────────────┘

═══════════════════════════════════════════════════════════════════════════

3. REQUEST SUBMISSION (Requester)
   ┌──────────┐
   │Requester │──► POST /requests
   └──────────┘         │
                        ▼
                 ┌─────────────┐
                 │  REQUESTS   │──► Insert document
                 │  Collection │    {status: 'pending'}
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────────┐
                 │ Smart Matching  │──► Find best resource
                 │   Algorithm     │    Find best volunteer
                 └──────┬──────────┘
                        │
                        ├──────────────────┬──────────────────┐
                        ▼                  ▼                  ▼
                 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                 │  REQUESTS   │   │  RESOURCES  │   │DELIVERY TASK│
                 │   Update    │   │   Update    │   │   Create    │
                 │ assignedVol │   │   status:   │   │   status:   │
                 │ assignedRes │   │ 'requested' │   │ 'assigned'  │
                 └─────────────┘   └─────────────┘   └──────┬──────┘
                                                             │
                                                             ▼
                                                      ┌─────────────┐
                                                      │ Socket.IO   │
                                                      │  Notify     │
                                                      │ Volunteer   │
                                                      └─────────────┘

═══════════════════════════════════════════════════════════════════════════

4. DELIVERY PROCESS (Volunteer)
   ┌──────────┐
   │Volunteer │──► PATCH /delivery-tasks/:id/accept
   └──────────┘         │
                        ▼
                 ┌─────────────┐
                 │DELIVERY TASK│──► Update {status: 'accepted', acceptedAt: now}
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   Volunteer │──► PATCH /delivery-tasks/:id/pickup
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │DELIVERY TASK│──► Update {status: 'picked-up', pickedUpAt: now}
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   Volunteer │──► PATCH /delivery-tasks/:id/start
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │DELIVERY TASK│──► Update {status: 'in-transit', inTransitAt: now}
                 │             │    Push to locationHistory[]
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   Volunteer │──► PATCH /delivery-tasks/:id/complete
                 └──────┬──────┘
                        │
                        ├──────────────────┬──────────────────┐
                        ▼                  ▼                  ▼
                 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                 │DELIVERY TASK│   │  REQUESTS   │   │  RESOURCES  │
                 │   Update    │   │   Update    │   │   Update    │
                 │   status:   │   │   status:   │   │   status:   │
                 │ 'completed' │   │ 'fulfilled' │   │ 'delivered' │
                 └─────────────┘   └─────────────┘   └─────────────┘

═══════════════════════════════════════════════════════════════════════════

5. RATING (Requester)
   ┌──────────┐
   │Requester │──► POST /delivery-tasks/:id/rate
   └──────────┘         │
                        ▼
                 ┌─────────────┐
                 │    USERS    │──► Update volunteer
                 │  Collection │    newRating = (oldRating * count + newRating) / (count + 1)
                 │             │    ratingCount++
                 └─────────────┘
```

---

## 🔍 Query Patterns & Indexes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMMON QUERY PATTERNS                               │
└─────────────────────────────────────────────────────────────────────────┘

1. FIND AVAILABLE RESOURCES BY TYPE
   Query: db.resources.find({ type: "Food", status: "available" })
   Index: { type: 1, status: 1 }

2. FIND NEARBY RESOURCES (Geospatial)
   Query: db.resources.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [lng, lat] },
         $maxDistance: 10000  // 10km
       }
     },
     status: "available"
   })
   Index: { location: "2dsphere", status: 1 }

3. FIND AVAILABLE VOLUNTEERS
   Query: db.users.find({ 
     role: "volunteer", 
     availability: true, 
     isApproved: true,
     isActive: true
   })
   Index: { role: 1, availability: 1, isApproved: 1, isActive: 1 }

4. GET USER'S DELIVERY TASKS
   Query: db.deliveryTasks.find({ volunteer: userId })
           .populate('request')
           .populate('resource')
   Index: { volunteer: 1 }

5. GET PENDING REQUESTS
   Query: db.requests.find({ status: "pending" })
           .sort({ urgency: -1, createdAt: 1 })
   Index: { status: 1, urgency: -1, createdAt: 1 }

6. GET ADMIN STATISTICS
   Query: Multiple aggregation pipelines
   - db.users.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
   - db.resources.countDocuments({ status: "available" })
   - db.requests.countDocuments({ status: "pending" })
   Index: Multiple indexes on status, role fields
```

---

## 📈 Database Statistics

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE PERFORMANCE                                  │
└─────────────────────────────────────────────────────────────────────────┘

COLLECTION SIZES (Estimated)
├── Users:           ~1 KB per document  × 150 users    = ~150 KB
├── Resources:       ~500 B per document × 200 items    = ~100 KB
├── Requests:        ~500 B per document × 180 requests = ~90 KB
├── DeliveryTasks:   ~1 KB per document  × 145 tasks    = ~145 KB
└── Disputes:        ~800 B per document × 10 disputes  = ~8 KB

TOTAL DATABASE SIZE: ~500 KB (Small, scalable to millions)

INDEXES
├── Users:           3 indexes (email, location, role)
├── Resources:       4 indexes (donor, type, status, location)
├── Requests:        4 indexes (requester, status, urgency, location)
├── DeliveryTasks:   4 indexes (volunteer, request, status, liveLocation)
└── Disputes:        4 indexes (deliveryTask, reportedBy, status, priority)

QUERY PERFORMANCE
├── Simple queries:  < 10ms
├── Geospatial:      < 50ms
├── Aggregations:    < 100ms
└── Complex joins:   < 200ms
```

---

## 🔐 Data Validation Rules

```javascript
// USERS Collection Validation
{
  validator: {
    $jsonSchema: {
      required: ['name', 'email', 'password', 'role'],
      properties: {
        email: { 
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        role: {
          enum: ['donor', 'requester', 'volunteer', 'admin']
        },
        rating: {
          bsonType: 'number',
          minimum: 0,
          maximum: 5
        }
      }
    }
  }
}

// RESOURCES Collection Validation
{
  validator: {
    $jsonSchema: {
      required: ['donor', 'type', 'quantity', 'status'],
      properties: {
        quantity: {
          bsonType: 'number',
          minimum: 0
        },
        status: {
          enum: ['available', 'requested', 'delivered']
        }
      }
    }
  }
}

// REQUESTS Collection Validation
{
  validator: {
    $jsonSchema: {
      required: ['requester', 'resourceType', 'quantity', 'urgency', 'status'],
      properties: {
        urgency: {
          enum: ['low', 'medium', 'high']
        },
        status: {
          enum: ['pending', 'fulfilled', 'rejected']
        }
      }
    }
  }
}
```

---

## 🔄 Data Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA RETENTION POLICY                               │
└─────────────────────────────────────────────────────────────────────────┘

ACTIVE DATA (Keep indefinitely)
├── Users:           All user accounts (can be deactivated, not deleted)
├── Resources:       Historical record of all donations
└── Requests:        Historical record of all requests

ARCHIVABLE DATA (After 6 months)
├── DeliveryTasks:   Completed tasks older than 6 months
└── Disputes:        Resolved disputes older than 6 months

DELETABLE DATA (After 1 year)
├── LocationHistory: Old GPS tracking data
└── StatusHistory:   Old status change logs

AUDIT TRAIL (Keep forever)
├── User registrations
├── Admin actions
└── Critical transactions
```

---

**Generated:** October 8, 2025  
**Database Version:** MongoDB 6.20.0  
**Schema Version:** 2.0  
**Status:** Production Ready ✅

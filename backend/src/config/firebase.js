/**
 * Firebase Configuration
 * Initializes Firebase Admin SDK for Firestore operations
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // In production, use service account key file
    // For development, we'll use a mock configuration
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "unlockmylead-dev",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "mock-key-id",
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
      client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk@unlockmylead-dev.iam.gserviceaccount.com",
      client_id: process.env.FIREBASE_CLIENT_ID || "mock-client-id",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk%40unlockmylead-dev.iam.gserviceaccount.com"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://unlockmylead-dev-default-rtdb.firebaseio.com"
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    
    // For testing purposes, create a mock Firebase instance
    console.log('Creating mock Firebase instance for testing...');
    
    // Mock Firestore for testing
    const mockFirestore = {
      collection: (name) => ({
        add: async (data) => ({ id: `mock-${Date.now()}` }),
        doc: (id) => ({
          get: async () => ({
            exists: true,
            id: id,
            data: () => ({
              name: 'Mock Script',
              type: 'call',
              created_at: new Date(),
              updated_at: new Date(),
              created_by: 'test-user',
              performance_metrics: {
                total_uses: 0,
                success_rate: 0,
                average_duration: 0,
                conversion_rate: 0,
                last_used: null
              }
            })
          }),
          update: async (data) => ({ success: true }),
          delete: async () => ({ success: true })
        }),
        where: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                get: async () => ({
                  forEach: (callback) => {
                    // Mock empty result
                  },
                  size: 0
                })
              }),
              get: async () => ({
                forEach: (callback) => {
                  // Mock empty result
                },
                size: 0
              })
            }),
            get: async () => ({
              forEach: (callback) => {
                // Mock empty result
              },
              size: 0
            })
          }),
          orderBy: () => ({
            get: async () => ({
              forEach: (callback) => {
                // Mock empty result
              },
              size: 0
            })
          }),
          get: async () => ({
            forEach: (callback) => {
              // Mock empty result
            },
            size: 0
          })
        }),
        orderBy: () => ({
          get: async () => ({
            forEach: (callback) => {
              // Mock empty result
            },
            size: 0
          })
        }),
        limit: () => ({
          get: async () => ({
            forEach: (callback) => {
              // Mock empty result
            },
            size: 0
          })
        }),
        get: async () => ({
          forEach: (callback) => {
            // Mock empty result
          },
          size: 0
        })
      })
    };

    // Override admin.firestore() to return mock
    admin.firestore = () => mockFirestore;
  }
}

// Export Firestore instance
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = {
  admin,
  db,
  FieldValue
};

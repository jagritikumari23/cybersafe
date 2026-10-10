import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User } from 'firebase/auth';

// Extend the NextApiRequest type to include the user
interface AuthenticatedRequest extends NextApiRequest {
  user: User;
}

export const withAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => 
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get the current user
      const currentUser = auth.currentUser;
      
      // Verify the user is authenticated
      if (!currentUser) {
        // Check for Authorization header as fallback
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'No authentication token provided'
          });
        }

        // Here you could verify ID tokens from the Authorization header
        // const token = authHeader.split(' ')[1];
        // const decodedToken = await verifyIdToken(token);
        // currentUser = await getUser(decodedToken.uid);
      }

      // Add user to the request object
      (req as AuthenticatedRequest).user = currentUser!;

      // Call the handler with the authenticated request
      return await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token'
      });
    }
  };

// Example usage in an API route:
/*
import { withAuth } from '@/middleware/withAuth';

export default withAuth(async (req, res) => {
  // Your protected route logic here
  // Access the authenticated user via req.user
  res.status(200).json({ user: req.user });
});
*/

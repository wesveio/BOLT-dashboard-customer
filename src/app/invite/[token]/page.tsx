'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';;

/**
 * Public page to accept user invitations
 * Accessible via /invite/[token]
 */
export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid invitation token');
        return;
      }

      try {
        // The API endpoint uses [id] but accepts the token UUID
        const response = await fetch(`/api/dashboard/users/invitations/${token}/accept`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to accept invitation');
        }

        const data = await response.json();
        setStatus('success');
        setMessage(data.message || 'Invitation accepted successfully! You can now sign in with your email.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Accept invitation error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to accept invitation');
      }
    };

    acceptInvitation();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {status === 'loading' && (
              <>
                <Spinner size="lg" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Accepting Invitation...
                  </h1>
                  <p className="text-gray-600">
                    Please wait while we process your invitation
                  </p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Invitation Accepted!
                  </h1>
                  <p className="text-gray-600 mb-4">{message}</p>
                  <p className="text-sm text-gray-500">
                    Redirecting to login page...
                  </p>
                </div>
                <Button
                  color="primary"
                  onPress={() => router.push('/login')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Go to Login
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircleIcon className="w-10 h-10 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Invitation Error
                  </h1>
                  <p className="text-gray-600 mb-4">{message}</p>
                  <p className="text-sm text-gray-500">
                    The invitation may have expired or already been used.
                  </p>
                </div>
                <Button
                  variant="light"
                  onPress={() => router.push('/login')}
                >
                  Go to Login
                </Button>
              </>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}


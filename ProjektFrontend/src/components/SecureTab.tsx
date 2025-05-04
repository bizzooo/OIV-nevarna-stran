import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import DOMPurify from 'dompurify';

interface UserData {
  id: number;
  email: string;
  fullName: string;
  lastFourDigits: string;
}

interface SearchResult {
  id: number;
  email: string;
}

export function SecureTab() {
  // SQL Injection secure states
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResults, setSqlResults] = useState<SearchResult[]>([]);
  const [sqlError, setSqlError] = useState('');
  const [sqlLoading, setSqlLoading] = useState(false);

  // XSS secure states
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  // IDOR secure states
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  
  // SQL Injection secure handler - uses parameterized queries on backend
  const handleSecureSearch = async () => {
    setSqlLoading(true);
    setSqlError('');
    
    try {
      const response = await fetch('http://localhost:3000/secure/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlQuery }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }
      
      setSqlResults(data.results);
    } catch (err) {
      console.error('SQL Error:', err);
      setSqlError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSqlLoading(false);
    }
  };
  
  // XSS secure handler - uses sanitization
  const handleAddComment = () => {
    if (comment.trim()) {
      // Using DOMPurify to sanitize user input
      const sanitizedComment = DOMPurify.sanitize(comment);
      setComments([...comments, sanitizedComment]);
      setComment('');
    }
  };
  
  // IDOR secure handler - only shows current user's data
  const fetchCurrentUserData = async () => {
    setUserLoading(true);
    
    try {
      // Uses authentication token to fetch only the current user's data
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:3000/secure/profile`, {
        headers: {
          'Authorization': `Bearer ${user.token || ''}` 
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user data');
      }
      
      setUserData(data);
    } catch (err) {
      console.error('Profile Error:', err);
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl text-white mb-4">Secure Implementations (OWASP Top 10 Protections)</h2>
      
      {/* Secure Implementation 1: SQL Injection Prevention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. SQL Injection Prevention</CardTitle>
          <CardDescription>
            Uses parameterized queries and input validation to prevent SQL injection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sqlQuerySecure">Search users by username:</Label>
              <div className="flex mt-2">
                <Input
                  id="sqlQuerySecure"
                  placeholder="Enter username to search"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button 
                  onClick={handleSecureSearch}
                  disabled={sqlLoading}
                >
                  {sqlLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            
            {sqlError && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-200">
                {sqlError}
              </div>
            )}
            
            {sqlResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="p-2 text-left text-white border border-gray-600">ID</th>
                      <th className="p-2 text-left text-white border border-gray-600">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sqlResults.map((user, index) => (
                      <tr key={index} className="bg-gray-800">
                        <td className="p-2 text-white border border-gray-600">{user.id}</td>
                        <td className="p-2 text-white border border-gray-600">{user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-200">
              <h3 className="font-bold mb-1">Security Measures:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Uses parameterized queries on the backend</li>
                <li>Implements input validation</li>
                <li>Uses proper error handling to prevent information leakage</li>
                <li>Utilizes least privilege database user</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Secure Implementation 2: XSS Prevention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Cross-Site Scripting (XSS) Prevention</CardTitle>
          <CardDescription>
            Uses input sanitization to prevent XSS attacks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="commentSecure">Add a comment:</Label>
              <div className="flex mt-2">
                <Input
                  id="commentSecure"
                  placeholder="Enter your comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button onClick={handleAddComment}>
                  Add Comment
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-700 rounded p-4 bg-gray-800/50">
              <h3 className="text-white font-medium mb-3">Comments:</h3>
              {comments.length === 0 ? (
                <p className="text-gray-400">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-700 rounded"
                      dangerouslySetInnerHTML={{ __html: comment }} 
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-200">
              <h3 className="font-bold mb-1">Security Measures:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Uses DOMPurify to sanitize user input</li>
                <li>Implements Content Security Policy (CSP)</li>
                <li>Sets appropriate HTTP response headers</li>
                <li>Uses output encoding</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Secure Implementation 3: IDOR Prevention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. IDOR Prevention</CardTitle>
          <CardDescription>
            Implements proper authentication and authorization checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>View your profile data:</Label>
              <div className="flex mt-2">
                <Button 
                  onClick={fetchCurrentUserData}
                  disabled={userLoading}
                  className="w-full"
                >
                  {userLoading ? 'Loading...' : 'View My Profile'}
                </Button>
              </div>
            </div>
            
            {userData && (
              <div className="p-4 bg-gray-700 rounded">
                <h3 className="text-lg font-medium text-white mb-2">Your Information:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-300">ID:</div>
                  <div className="text-white">{userData.id}</div>
                  
                  <div className="text-gray-300">Email:</div>
                  <div className="text-white">{userData.email}</div>
                  
                  <div className="text-gray-300">Full Name:</div>
                  <div className="text-white">{userData.fullName}</div>
                  
                  <div className="text-gray-300">Credit Card:</div>
                  <div className="text-white">••••-••••-••••-{userData.lastFourDigits}</div>
                </div>
              </div>
            )}
            
            <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-200">
              <h3 className="font-bold mb-1">Security Measures:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Implements proper authentication with JWT tokens</li>
                <li>Uses role-based access control (RBAC)</li>
                <li>Conducts authorization checks on every request</li>
                <li>Uses indirect reference maps</li>
                <li>Masks sensitive information (credit card)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
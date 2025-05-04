import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface UserData {
  id: number;
  email: string;
  fullName: string;
  creditCard: string;
  ssn: string;
}

interface SearchResult {
  id: number;
  email: string;
}

export function VulnerableTab() {
  // SQL Injection vulnerability states
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResults, setSqlResults] = useState<SearchResult[]>([]);
  const [sqlError, setSqlError] = useState('');
  const [sqlLoading, setSqlLoading] = useState(false);

  // XSS vulnerability states
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  // IDOR vulnerability states
  const [userId, setUserId] = useState('1');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  
  // SQL Injection handler
  const handleSqlInjection = async () => {
    setSqlLoading(true);
    setSqlError('');
    
    try {
      const response = await fetch('http://localhost:3000/vulnerable/search', {
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
  
  // XSS handler
  const handleAddComment = () => {
    if (comment.trim()) {
      setComments([...comments, comment]);
      setComment('');
    }
  };
  
  // IDOR handler
  const fetchUserData = async () => {
    setUserLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3000/vulnerable/users/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user data');
      }
      
      setUserData(data);
    } catch (err) {
      console.error('IDOR Error:', err);
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl text-white mb-4">Vulnerable Implementations (OWASP Top 10)</h2>
      
      {/* Vulnerability 1: SQL Injection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. SQL Injection (A03:2021)</CardTitle>
          <CardDescription>
            Try SQL Injection attacks like: ' OR '1'='1 to see all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sqlQuery">Search users by username:</Label>
              <div className="flex mt-2">
                <Input
                  id="sqlQuery"
                  placeholder="Enter username to search"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button 
                  onClick={handleSqlInjection}
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
          </div>
        </CardContent>
      </Card>
      
      {/* Vulnerability 2: Cross-Site Scripting (XSS) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. Cross-Site Scripting - XSS (A03:2021)</CardTitle>
          <CardDescription>
            Try entering JavaScript like: &lt;script&gt;alert('XSS')&lt;/script&gt; or &lt;img src="x" onerror="alert('XSS')"&gt;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Add a comment:</Label>
              <div className="flex mt-2">
                <Input
                  id="comment"
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
          </div>
        </CardContent>
      </Card>
      
      {/* Vulnerability 3: Insecure Direct Object References (IDOR) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. Insecure Direct Object References - IDOR (A01:2021)</CardTitle>
          <CardDescription>
            Try accessing different user IDs to view any user's sensitive information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">View user profile by ID:</Label>
              <div className="flex mt-2">
                <Input
                  id="userId"
                  type="number"
                  min="1"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="flex-1 mr-2"
                />
                <Button 
                  onClick={fetchUserData}
                  disabled={userLoading}
                >
                  {userLoading ? 'Loading...' : 'View User'}
                </Button>
              </div>
            </div>
            
            {userData && (
              <div className="p-4 bg-gray-700 rounded">
                <h3 className="text-lg font-medium text-white mb-2">User Information:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-300">ID:</div>
                  <div className="text-white">{userData.id}</div>
                  
                  <div className="text-gray-300">Email:</div>
                  <div className="text-white">{userData.email}</div>
                  
                  <div className="text-gray-300">Full Name:</div>
                  <div className="text-white">{userData.fullName}</div>
                  
                  <div className="text-gray-300">Credit Card:</div>
                  <div className="text-white">{userData.creditCard}</div>
                  
                  <div className="text-gray-300">SSN:</div>
                  <div className="text-white">{userData.ssn}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
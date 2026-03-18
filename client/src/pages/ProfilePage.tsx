import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, ShieldCheck, LogOut, CircleDot } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-6">
        <User className="h-6 w-6 text-[#0D8A6E]" aria-hidden="true" />
        <h1 className="text-2xl font-light">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-5">
              <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarFallback className="bg-[#0D8A6E] text-white text-xl font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{user?.name}</p>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
            </div>

            <Separator className="mb-4" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">User ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {user?.sub ?? user?.id}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Session</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data storage</span>
                <Badge variant="info" className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3" aria-hidden="true" /> None
                </Badge>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="mt-6 w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Privacy card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0D8A6E]" aria-hidden="true" />
                Privacy &amp; HIPAA Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm text-muted-foreground space-y-2">
                {[
                  'Lab reports are processed in memory and immediately discarded.',
                  'No report content is written to any database or storage.',
                  'Session history stores only metadata (title, timestamp, status).',
                  'All API calls use encrypted HTTPS in transit.',
                  'Image EXIF metadata is stripped before AI processing.',
                  'Rate limiting prevents bulk data extraction.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#0D8A6E] mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4 italic">
                HealthLens is designed with HIPAA privacy principles in mind. It is not a covered
                entity and this app does not constitute a business associate agreement.
              </p>
            </CardContent>
          </Card>

          {/* Powered-by card */}
          <Card className="bg-muted/40">
            <CardContent className="pt-5">
              <h3 className="text-sm font-medium mb-2">Powered by</h3>
              <p className="text-sm"><strong>Gradient AI</strong> — Serverless Inference</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

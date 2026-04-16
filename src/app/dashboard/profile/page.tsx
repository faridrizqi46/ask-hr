import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield } from "lucide-react";

export default function ProfilePage() {
  const userName = "Emily Nates";
  const userEmail = "emily.nates@company.com";
  const userRole = "HR Administrator";

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold">{userName}</h2>
          <Badge variant="secondary" className="mt-1">
            {userRole}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24">Name</span>
              <span className="text-sm font-medium">{userName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground w-24">Email</span>
              <span className="text-sm font-medium">{userEmail}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-24">Role</span>
              <Badge>{userRole}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              As an HR Administrator, you have full access to manage job listings and analyze CVs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, UserRole } from "@/types";

// Government ID types
const GOV_ID_TYPES = [
  { value: "aadhar", label: "Aadhar Card" },
  { value: "passport", label: "Passport" },
  { value: "pan", label: "PAN Card" },
  { value: "voter", label: "Voter ID" },
  { value: "driving", label: "Driving License" },
];

// Professional avatars by role
const PROFESSIONAL_AVATARS: Record<UserRole, string[]> = {
  client: [
    "https://ui-avatars.com/api/?name=Client&background=6366f1&color=fff",
    "https://ui-avatars.com/api/?name=CL&background=8b5cf6&color=fff"
  ],
  lawyer: [
    "https://ui-avatars.com/api/?name=Lawyer&background=0ea5e9&color=fff",
    "https://ui-avatars.com/api/?name=LW&background=0284c7&color=fff"
  ],
  clerk: [
    "https://ui-avatars.com/api/?name=Clerk&background=10b981&color=fff",
    "https://ui-avatars.com/api/?name=CK&background=059669&color=fff"
  ],
  judge: [
    "https://ui-avatars.com/api/?name=Judge&background=ef4444&color=fff",
    "https://ui-avatars.com/api/?name=JD&background=b91c1c&color=fff"
  ]
};

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  governmentId: z.object({
    type: z.string().optional(),
    number: z.string().optional()
  }).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileEdit = () => {
  const { userData, isAuthenticated } = useFirebaseAuth();
  const navigate = useNavigate();
  const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.name || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
      address: userData?.address || "",
      specialization: userData?.specialization || "",
      governmentId: {
        type: userData?.governmentId?.type || "",
        number: userData?.governmentId?.number || ""
      }
    }
  });

  // Set available avatars based on user role
  useEffect(() => {
    if (userData?.role) {
      const roleAvatars = PROFESSIONAL_AVATARS[userData.role] || [];
      // Add the current avatar to the list if it's not already there
      if (userData.avatarUrl && !roleAvatars.includes(userData.avatarUrl)) {
        setAvailableAvatars([...roleAvatars, userData.avatarUrl]);
      } else {
        setAvailableAvatars(roleAvatars);
      }
      setSelectedAvatar(userData.avatarUrl || roleAvatars[0]);
    }
  }, [userData]);

  if (!userData) {
    return null; // Will redirect via the useEffect
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      // Prepare the updated user data
      const updatedUser: User = {
        ...userData,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        specialization: data.specialization,
        avatarUrl: selectedAvatar,
        governmentId: {
          type: data.governmentId?.type || "",
          number: data.governmentId?.number || ""
        }
      };

      // Update user in firebase
      // Note: In a real implementation, you would call a function to update the user in Firebase
      // For now we'll just show a toast and navigate back

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      // Navigate back to account page
      navigate("/account");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">
          Update your personal information and profile settings
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Choose a professional avatar for your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={selectedAvatar} />
                    <AvatarFallback>{userData.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {availableAvatars.map((avatar, index) => (
                    <div 
                      key={index}
                      className={`cursor-pointer border-2 rounded-md overflow-hidden 
                        ${selectedAvatar === avatar ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <Avatar className="h-16 w-16 mx-auto">
                        <AvatarImage src={avatar} />
                        <AvatarFallback>{userData.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Your address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userData.role === 'lawyer' && (
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Your legal specialization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Government ID</CardTitle>
              <CardDescription>
                Your government identification details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="governmentId.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GOV_ID_TYPES.map(idType => (
                            <SelectItem key={idType.value} value={idType.value}>
                              {idType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="governmentId.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default ProfileEdit;

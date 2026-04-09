import React, { useEffect, useMemo, useState } from "react";

import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage } from "../services/apiClient";
import { getUserProfile, type UserProfile } from "../services/userService";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentProfileDraft = {
  firstName: string;
  lastName: string;
  major: string;
  school: string;
  yearOfStudy: string;
  bio: string;
};

const emptyDraft: StudentProfileDraft = {
  firstName: "",
  lastName: "",
  major: "",
  school: "",
  yearOfStudy: "",
  bio: "",
};

function ProfilePage() {
  const { user, sessionKey } = useAuth();
  const [draft, setDraft] = useState<StudentProfileDraft>(emptyDraft);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const storageKey = useMemo(
    () => {
      const scopedUserId = profile?.id || user?.uid;
      return scopedUserId ? `sps.profile.draft.${scopedUserId}` : null;
    },
    [profile?.id, user?.uid],
  );

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setDraft(emptyDraft);
      setLoading(false);
      setError(null);
      setNotice(null);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [sessionKey, user]);

  useEffect(() => {
    setDraft(emptyDraft);
    setNotice(null);
  }, [sessionKey]);

  useEffect(() => {
    if (!storageKey) return;

    const savedDraft = localStorage.getItem(storageKey);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft) as Partial<StudentProfileDraft>;
      setDraft({
        ...emptyDraft,
        ...parsed,
      });
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const onChange =
    (field: keyof StudentProfileDraft) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft((prev) => ({ ...prev, [field]: event.target.value }));
      setNotice(null);
    };

  const saveDraft = () => {
    if (!storageKey) return;

    localStorage.setItem(storageKey, JSON.stringify(draft));
    setNotice("Profile draft saved on this device.");
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setNotice(null);

    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <Layout>
      <ErrorToast message={error} onClose={() => setError(null)} />
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Basic student information. This form is client-only for now, so
              changes are saved locally until the update API is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            )}

            {!loading && profile && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Account ID
                  </p>
                  <p className="text-sm break-all text-muted-foreground">
                    {profile.id}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
            <CardDescription>
              Add the basic profile details you want to show later. Date of
              birth is intentionally left out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={draft.firstName}
                  onChange={onChange("firstName")}
                  placeholder="Alex"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={draft.lastName}
                  onChange={onChange("lastName")}
                  placeholder="Johnson"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={draft.major}
                  onChange={onChange("major")}
                  placeholder="Computer Science"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearOfStudy">Year of study</Label>
                <Input
                  id="yearOfStudy"
                  value={draft.yearOfStudy}
                  onChange={onChange("yearOfStudy")}
                  placeholder="Junior"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                value={draft.school}
                onChange={onChange("school")}
                placeholder="Your university or college"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Short bio</Label>
              <textarea
                id="bio"
                value={draft.bio}
                onChange={onChange("bio")}
                className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="Share a little about your focus, interests, or study style."
              />
            </div>

            {notice && <p className="text-sm text-emerald-700">{notice}</p>}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={resetDraft}>
                Reset
              </Button>
              <Button type="button" onClick={saveDraft}>
                Save draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}

export default ProfilePage;

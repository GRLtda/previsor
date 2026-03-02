"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileBadge, type ProfileRole } from "@/components/shared/profile-badge";

export default function BadgeDemoPage() {
    const roles: ProfileRole[] = ["moderator", "developer", "system", "vip"];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Profile Badges (Embeds)</h1>
                <p className="text-muted-foreground">Demonstração dos novos badges de perfil seguindo o flat design do projeto.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Badges de Cargos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-center">
                        {roles.map((role) => (
                            <ProfileBadge key={role} role={role} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Apenas Texto (Sem Ícone)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-center">
                        {roles.map((role) => (
                            <ProfileBadge key={role} role={role} showIcon={false} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle>Dark Mode Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 items-center">
                            {roles.map((role) => (
                                <ProfileBadge key={role} role={role} />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>In Context (Header Example)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">JD</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold">John Doe</h3>
                                    <ProfileBadge role="developer" className="h-6" />
                                </div>
                                <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { getPageTitle } from "../nav-config";
import { CreateTitleDialog } from "./create-title-dialog";

// export const metadata: Metadata = {
//     title: getPageTitle("titles"),
// };

export default function TitlesPage() {
    const [open, setOpen] = useState(true);

    return (
        <div className="flex-1">
            <CreateTitleDialog open={open} onOpenChange={setOpen} />
        </div>
    );
}

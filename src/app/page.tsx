import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <main>
            <h1>hello /</h1>
            <Button nativeButton={false} render={<Link href="/login">Login</Link>} />
        </main>
    );
}

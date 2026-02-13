import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground p-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-muted/10 p-4 rounded-full mb-2">
                    <FileQuestion className="h-16 w-16 text-muted-foreground" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Page Not Found</h2>
                <p className="text-lg text-muted-foreground max-w-[500px] mt-2">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                </p>
            </div>
            <Button asChild className="mt-6" size="lg">
                <Link href="/">
                    Return Home
                </Link>
            </Button>
        </div>
    )
}

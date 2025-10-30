import { RegisterForm } from "@/components/register-form";
import { FilePenLine } from "lucide-react";

const RegisterPage = () => {
    return (
        <div className="container py-12">
            <header className="mb-12 text-center">
                <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
                    <FilePenLine className="h-8 w-8 text-primary"/>
                </div>
                <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                    Register Your Action
                </h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                    Fill out the form below to add your regenerative action to the public impact wall for validation.
                </p>
            </header>
            <div className="mx-auto max-w-3xl">
                <RegisterForm />
            </div>
        </div>
    );
}

export default RegisterPage;

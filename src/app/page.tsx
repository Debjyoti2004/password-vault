// Feature card component with light and dark mode support
const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="relative p-6 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 rounded-xl backdrop-blur-sm overflow-hidden h-full">
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
                 <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{children}</p>
        </div>
    </div>
);


export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white pt-28">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/30 rounded-full filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        <section className="flex-grow flex items-center pt-16 pb-12">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    Unlock True Security
                </h1>
                 <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-purple-600">
                    Your Passwords, Encrypted.
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                  Generate strong passwords, save them securely, and access them anywhere.
                  Built with privacy at its core.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <a
                        href="/signup"
                        className="px-8 py-3 font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg transition hover:shadow-blue-500/50 transform hover:scale-105"
                    >
                        Get Started
                    </a>
                </div>
            </div>
        </section>

         <section className="container mx-auto px-6 py-16 md:py-24">
             <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    title="Secure Encryption"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}
                >
                    Client-side encryption means only <span className="font-bold text-gray-800 dark:text-white">you</span> can see your data. The server never stores your plaintext passwords.
                </FeatureCard>
                 <FeatureCard 
                    title="Powerful Generator"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>}
                >
                    Create uncrackable, complex passwords in an instant with customizable length and character options.
                </FeatureCard>
                 <FeatureCard 
                    title="Organized Vault"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>}
                >
                   Effortlessly manage all your logins, notes, and important information in a clean and intuitive interface.
                </FeatureCard>
             </div>
        </section>

        <footer className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} LockBox. All Rights Reserved.</p>
        </footer>
      </div>
    </main>
  );
}


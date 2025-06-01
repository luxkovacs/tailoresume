import React, { useState } from 'react'; // Added useState
import { Link } from 'react-router-dom'; 
// Importing specific icons from lucide-react
import { WandSparkles, Bot, FileText, Upload, ShieldCheck, HelpCircle, FileLock2, HandCoins, ChevronDown } from 'lucide-react'; // Added FileLock2, HandCoins, ChevronDown, removed MessageSquare

// Updated Icon component to be more generic or specific icons can be used directly
const FeatureIcon = ({ icon: Icon, className = "w-12 h-12 mb-4 text-indigo-600 dark:text-indigo-400" }: { icon: React.ElementType, className?: string }) => (
  <Icon className={className} strokeWidth={1.5} />
);

// FAQ Item Data Structure
const faqData = [
  {
    id: 1,
    icon: HelpCircle,
    question: "How does the AI tailoring work?",
    answer: "Our AI analyzes the job description you provide and compares it against the skills and experiences stored in your dynamic profile. It then suggests the most relevant information to include and can help rephrase bullet points to better match the employer's language and desired qualifications, increasing your chances of passing ATS scans and impressing recruiters."
  },
  {
    id: 2,
    icon: FileLock2, // Changed from MessageSquare
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption for data in transit and at rest. Your personal information and resume data are stored securely, and we are committed to protecting your privacy. You can find more details in our Privacy Policy. You always retain control over your data and can delete it at any time."
  },
  {
    id: 3,
    icon: FileText,
    question: "What is the Resume Standard?",
    answer: "The Resume Standard is an open-source initiative (which Tailoresume supports) to create a common JSON-based format for resume data. This makes your resume information portable, machine-readable, and easier to share or use across different platforms and tools that also support the standard. It helps ensure consistency and accuracy."
  },
  {
    id: 4,
    icon: HandCoins, // Changed from Bot
    question: "Can I use Tailoresume for free?",
    answer: "Yes, at the moment, Tailoresume is free to use for those who bring their own API key, allowing you to set up your own dynamic profile and generate a limited number of AI-tailored resumes. In the future, when Tailoresume is out of testing, we will offer subscription plans with more features, unlimited resume generations, and additional export options for users who need more."
  }
];

// New FAQItem Component
interface FAQItemProps {
  icon: React.ElementType;
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ icon: Icon, question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 focus:outline-none"
      >
        <span className="flex items-center">
          <Icon size={20} className="mr-3 flex-shrink-0" />
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="p-4 md:p-5 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/70 rounded-b-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const HomePage: React.FC = () => {
  return (
    <>
      {/* Global Decorative Blobs - Adjusted z-index */}
      {/* Blue Blob - Left Middle */}
      <div
        className="fixed top-1/3 left-0 w-[50vw] h-[60vh] md:w-[40vw] md:h-[70vh] bg-gradient-radial from-blue-300 via-blue-300 to-transparent dark:from-blue-500 dark:via-blue-500 dark:to-transparent opacity-40 dark:opacity-25 filter blur-3xl -translate-x-1/2 pointer-events-none z-0"
      ></div>
      {/* Pink Blob - Top Right */}
      <div
        className="fixed -top-1/4 right-0 w-[60vw] h-[60vh] md:w-[50vw] md:h-[80vh] bg-gradient-radial from-pink-300 via-pink-300 to-transparent dark:from-pink-500 dark:via-pink-500 dark:to-transparent opacity-30 dark:opacity-20 filter blur-3xl translate-x-1/2 pointer-events-none z-0"
      ></div>

      {/* Hero Section - Remains above global blobs */}
      <section className="relative py-20 md:py-32 bg-transparent z-10">
        <div className="container mx-auto px-6 text-center relative">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
            Craft Your Perfect Resume, <span className="text-indigo-600 dark:text-indigo-400">Effortlessly</span>.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Tailoresume helps you build a dynamic skills database and leverage AI to generate resumes perfectly matched to any job description, built on the Resume Standard.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/resume-builder" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-transform duration-150 ease-in-out"
            >
              Get Started Now
            </Link>
            <Link
              to="/examples" 
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-transform duration-150 ease-in-out"
            >
              See Examples
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section (Commented out) */}
      {/* <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 italic">Space for Trustpilot reviews / Social Proof (e.g., "Trusted by 1000+ job seekers")</p>
          {/* Add placeholder for stars or logos later * /}
        </div>
      </section> */}

      {/* About/Core Value Section - Cardified */}
      <section className="relative py-16 md:py-24 bg-transparent z-10">
        <div className="container mx-auto px-6">
          {/* This div becomes the card */}
          <div className="bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-850 p-8 md:p-12 rounded-xl shadow-xl">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                What Makes <span className="text-indigo-600 dark:text-indigo-400">Tailoresume</span> Different?
              </h2>
              <p className="text-gray-700 dark:text-gray-400 max-w-3xl mx-auto text-lg">
                Unlike other resume builders, Tailoresume focuses on building a comprehensive, reusable database of your skills and experiences. We adhere to the <a href="https://github.com/rezi-io/resume-standard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Resume Standard</a>, ensuring your data is structured, portable, and ready to be tailored by our AI for any opportunity.
              </p>
            </div>

            {/* Features Section - Grid/Cards - Already cardified, styles are consistent */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-shadow duration-300 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-850">
                <FeatureIcon icon={WandSparkles} /> {/* Changed icon here */}
                <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Dynamic Profile</h3> {/* Changed text-xl to text-lg */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Maintain a central hub for all your skills, work history, education, and projects. Update once, use everywhere.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="p-6 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-shadow duration-300 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-850">
                <FeatureIcon icon={Bot} />
                <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300">AI-Powered Tailoring</h3> {/* Changed text-xl to text-lg */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Our intelligent system analyzes job descriptions and customizes your resume to highlight the most relevant qualifications.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="p-6 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-shadow duration-300 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-850">
                <FeatureIcon icon={FileText} />
                <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Resume Standard</h3> {/* Changed text-xl to text-lg */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Built on an open-source standard for resume data, ensuring compatibility and future-proofing your career information.
                </p>
              </div>
              {/* Feature 4 */}
              <div className="p-6 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-shadow duration-300 bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-850">
                <FeatureIcon icon={Upload} /> {/* Changed icon here */}
                <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Multiple File Formats</h3> {/* Changed text from Multiple Export Options */}
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Generate your resume in various formats, including PDF and (soon) Word & LaTeX, to suit any application requirement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Security & Privacy Teaser Section - Cardified */}
      <section className="relative py-16 bg-transparent z-10">
        <div className="container mx-auto px-6">
          {/* This div becomes the card */}
          <div className="bg-gradient-to-b from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-850 p-8 md:p-12 rounded-xl shadow-xl text-center">
            <FeatureIcon icon={ShieldCheck} className="w-16 h-16 mb-4 text-indigo-600 dark:text-indigo-400 mx-auto" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Your Data, Your Control</h2>
            <p className="text-gray-700 dark:text-gray-400 max-w-2xl mx-auto mb-6">
              We prioritize your privacy and data security. Learn more about how we protect your information in our <Link to="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </section>
      
      {/* FAQ Section - Now a single card with toggle items */}
      <section className="relative py-16 md:py-24 bg-transparent z-10">
        <div className="container mx-auto px-6">
          {/* This div becomes the main FAQ card */}
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-850 p-8 md:p-12 rounded-xl shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12 text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqData.map((item) => (
                <FAQItem key={item.id} icon={item.icon} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Cardified */}
      <section className="relative py-20 bg-transparent z-10">
        <div className="container mx-auto px-6">
          {/* This div becomes the card */}
          <div className="bg-gradient-to-b from-indigo-100 to-indigo-200 dark:from-indigo-700 dark:to-indigo-800 p-10 md:p-16 rounded-xl shadow-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Ready to Elevate Your Resume?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-10 max-w-xl mx-auto">
              Join Tailoresume today and experience the future of resume building.
            </p>
            <Link
              to="/signup" 
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-4 px-10 rounded-lg text-xl shadow-xl transform hover:scale-105 transition-transform duration-150 ease-in-out"
            >
              Sign Up for Free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
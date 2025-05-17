
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EmergencyAlertButton from '@/components/emergency-alert-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FilePenLine, ListOrdered, ShieldAlert, Info, PlayCircle, Languages } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <Image 
          src="https://placehold.co/1200x400.png" 
          alt="Cybersecurity awareness banner" 
          width={1200} 
          height={400} 
          className="rounded-lg shadow-lg mx-auto mb-6"
          data-ai-hint="cybersecurity digital protection"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Welcome to CyberSafe</h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
          Your trusted platform for reporting cybercrime incidents and ensuring digital safety. We are here to help you navigate the complexities of online threats.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 mb-12 items-stretch"> {/* Changed items-center to items-stretch */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><FilePenLine className="mr-2 h-6 w-6 text-accent" /> Report an Incident</CardTitle>
            <CardDescription>Experienced a cybercrime? Submit your report through our secure and easy-to-use form.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-foreground/80 mb-4">
              Provide details about hacking, online fraud, identity theft, cyberbullying, and more. Your report will be handled with confidentiality and urgency.
            </p>
             <div className="mt-2 text-sm text-muted-foreground">
                <Languages className="inline-block mr-1 h-4 w-4" /> Supports descriptions in multiple Indian languages (AI translated to English for processing).
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/report-incident">File a New Report</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><ListOrdered className="mr-2 h-6 w-6 text-primary" /> Track Your Report</CardTitle>
            <CardDescription>Stay updated on the status of your submitted cybercrime reports in real-time.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-foreground/80 mb-4">
              Our system provides transparent updates from case filing to investigation progress and resolution, including AI-powered triage and escalation suggestions.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full">
              <Link href="/track-report">Check Report Status</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
      
      <section className="text-center my-16 p-8 bg-card rounded-lg shadow-xl border border-destructive/50">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-destructive mb-3">In an Emergency?</h2>
          <p className="text-foreground/80 max-w-2xl mx-auto mb-6">
            If you are currently experiencing a live cyber attack or are in immediate danger, use our Emergency Alert button to quickly notify the cybercell helpline.
          </p>
          <EmergencyAlertButton />
      </section>

      <section className="mb-12">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><Info className="mr-2 h-6 w-6 text-primary" /> How CyberSafe Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-foreground/80">
            <p><strong>1. Report:</strong> Fill out a simple form detailing the cybercrime incident (supports multiple languages for description), and upload any supporting evidence.</p>
            <p><strong>2. AI Analysis:</strong> Your description (if not in English) is translated. Our advanced AI system then automatically categorizes your report, assesses its urgency, and suggests an appropriate escalation path based on Indian cybercrime protocols.</p>
            <p><strong>3. Track:</strong> Monitor the real-time status of your report through your dashboard as it moves through investigation stages.</p>
            <p><strong>4. Chat (if applicable):</strong> If an officer is assigned (typically for medium/high urgency cases), you can chat with them directly for updates.</p>
            <p><strong>5. Stay Safe:</strong> Access resources and tips to protect yourself from future cyber threats.</p>
          </CardContent>
        </Card>
      </section>

      <section className="my-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Guided Video Tutorials</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "How to Report Fraud (2 mins)", lang: "English", hint: "tutorial online safety" },
            { title: "कैसे फ्रॉड रिपोर्ट करें (2 मिनट)", lang: "हिंदी", hint: "tutorial guide" },
            { title: "ฟรอด\n் ரிப்போர்ட் செய்வது எப்படி (2 நிமிடம்)", lang: "தமிழ்", hint: "tutorial help" },
          ].map((video, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Image 
                  src={`https://placehold.co/600x338.png?text=${encodeURIComponent(video.title)}`}
                  alt={`Placeholder for video: ${video.title}`} 
                  width={600} 
                  height={338} 
                  className="rounded-t-lg aspect-video object-cover"
                  data-ai-hint={video.hint}
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-1 flex items-center"><PlayCircle className="mr-2 h-5 w-5 text-accent" /> {video.title}</CardTitle>
                <CardDescription>Language: {video.lang}</CardDescription>
              </CardContent>
              <CardFooter>
                 {/* In a real app, this button would link to the video or a modal */}
                <Button variant="outline" className="w-full" disabled>Watch Tutorial (Coming Soon)</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
         <p className="text-center mt-6 text-muted-foreground">More tutorials in various regional languages coming soon!</p>
      </section>

    </div>
  );
}

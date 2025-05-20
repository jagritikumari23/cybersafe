
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EmergencyAlertButton from '@/components/emergency-alert-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FilePenLine, ListOrdered, ShieldAlert, Info, PlayCircle, Languages, ShieldQuestion, BarChart3, Map } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <Image 
          src="https://cdn.mos.cms.futurecdn.net/4GzLubqEAJTg2BP2ggzwvG.jpg" 
          alt="Cybersecurity awareness banner" 
          width={1200} 
          height={400} 
          className="rounded-lg shadow-lg mx-auto mb-6 object-cover"
          data-ai-hint="cybersecurity digital protection"
          priority // Added priority as it's likely LCP
        />
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Welcome to CyberSafe</h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto">
          Your trusted platform for reporting cybercrime incidents and ensuring digital safety. We are here to help you navigate the complexities of online threats.
        </p>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 items-stretch">
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><FilePenLine className="mr-2 h-6 w-6 text-accent" /> Report an Incident</CardTitle>
            <CardDescription>Submit your cybercrime report securely and easily.</CardDescription>
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
            <CardDescription>Stay updated on the status of your submitted reports.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-foreground/80 mb-4">
              Our system provides transparent updates, including AI-powered triage and escalation suggestions. Chat with assigned officers for high-urgency cases.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full">
              <Link href="/track-report">Check Report Status</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl"><ShieldQuestion className="mr-2 h-6 w-6 text-green-500" /> Cyber Risk Check</CardTitle>
            <CardDescription>Assess your personal cybersecurity risk level.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-foreground/80 mb-4">
             Answer a few simple questions to get a personalized cyber risk score and actionable tips to improve your online safety.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full bg-green-500 text-white hover:bg-green-600">
              <Link href="/cyber-risk-assessment">Take Assessment</Link>
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
            <p><strong>1. Report:</strong> Fill out a simple form detailing the incident (supports multiple languages), upload evidence, and provide suspect/location info if known.</p>
            <p><strong>2. AI Analysis:</strong> Your report is translated (if needed), triaged for urgency/category, checked for known fraud patterns, and an escalation path is suggested.</p>
            <p><strong>3. Track & Engage:</strong> Monitor status via your dashboard. For urgent cases, chat with an assigned officer. All reports get timeline notes for clarity.</p>
            <p><strong>4. Stay Safe:</strong> Use our Cyber Risk Check tool and access resources like guided tutorials to enhance your digital safety.</p>
          </CardContent>
        </Card>
      </section>

      <section className="my-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">Cybercrime Trends &amp; Heatmap (Coming Soon)</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl"><Map className="mr-2 h-5 w-5 text-blue-500"/>Regional Cybercrime Heatmap</CardTitle>
                    <CardDescription>Visualizing reported incidents across different areas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Image 
                        src="https://placehold.co/800x400.png?text=Heatmap+Data+Placeholder" 
                        alt="Placeholder for cybercrime heatmap" 
                        width={800} 
                        height={400} 
                        className="rounded-md shadow-md mx-auto aspect-video object-cover"
                        data-ai-hint="map data visualization"
                    />
                    <p className="text-sm text-muted-foreground mt-2 text-center">This is a placeholder. A real heatmap would show crime hotspots.</p>
                </CardContent>
            </Card>
            <div className="space-y-4">
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><BarChart3 className="mr-2 h-5 w-5 text-yellow-500"/>Weekly Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">Spike in SIM Swap Scams in [State/Region]</p>
                        <p className="text-xs text-muted-foreground">Reports indicate a 25% increase this week.</p>
                        <Button variant="link" size="sm" className="px-0 h-auto mt-1" disabled>Learn More (Soon)</Button>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><BarChart3 className="mr-2 h-5 w-5 text-red-500"/>Emerging Threat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">AI Voice Cloning for Extortion</p>
                        <p className="text-xs text-muted-foreground">Early reports of scams using AI-generated voice.</p>
                         <Button variant="link" size="sm" className="px-0 h-auto mt-1" disabled>Read Advisory (Soon)</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
         <p className="text-center text-muted-foreground">Real-time trend analysis and interactive heatmaps are planned for future updates.</p>
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

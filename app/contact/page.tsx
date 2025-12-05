'use client';

import { useState } from 'react';
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';
import { submitContactForm } from '@/lib/actions/contact.actions';
import { Metadata } from 'next';

// Note: Metadata is handled in layout.tsx for client components
const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Send us an email and we'll get back to you within 24 hours",
    contact: "support@renderiq.io",
    link: "mailto:support@renderiq.io"
  },
  {
    icon: MessageSquare,
    title: "General Inquiries",
    description: "For questions about features, pricing, or general information",
    contact: "info@renderiq.io",
    link: "mailto:info@renderiq.io"
  },
  {
    icon: Mail,
    title: "Sales & Partnerships",
    description: "Interested in enterprise plans or partnerships?",
    contact: "sales@renderiq.io",
    link: "mailto:sales@renderiq.io"
  },
  {
    icon: Mail,
    title: "Technical Support",
    description: "Need help with technical issues or have a bug report?",
    contact: "support@renderiq.io",
    link: "mailto:support@renderiq.io"
  }
];

const faqs = [
  {
    question: "How quickly will I receive a response?",
    answer: "We typically respond to all inquiries within 24 hours during business days. For urgent technical issues, please mark your email as urgent."
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer: "Yes! Contact our sales team at sales@renderiq.io to discuss custom plans, volume discounts, and enterprise features tailored to your organization's needs."
  },
  {
    question: "Can I schedule a demo?",
    answer: "Absolutely! Reach out to sales@renderiq.io to schedule a personalized demo of Renderiq's features and capabilities."
  },
  {
    question: "How do I report a bug?",
    answer: "You can report bugs by emailing support@renderiq.io with details about the issue, or use the contact form below. Please include steps to reproduce the issue."
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general' as 'general' | 'sales' | 'support' | 'partnership'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const result = await submitContactForm(formData);
      
      if (result.success) {
        setSubmitSuccess(true);
        toast.success(result.message || "Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          type: 'general'
        });
      } else {
        setSubmitError(result.error || 'Failed to send message. Please try again.');
        toast.error(result.error || 'Failed to send message');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again or email us directly.');
      toast.error('Failed to send message');
      console.error('Contact form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'type' ? value as typeof formData.type : value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Get in Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
            Have a question, feedback, or need help? We're here to assist you. 
            Reach out through any of the methods below or use the contact form.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <method.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                  <a 
                    href={method.link} 
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    {method.contact}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Success Message */}
                  {submitSuccess && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Thank you for your message! We've received it and will get back to you within 24 hours.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error Message */}
                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Inquiry Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">Inquiry Type *</Label>
                    <select
                      id="type"
                      name="type"
                      required
                      value={formData.type}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : submitSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Message Sent!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting this form, you agree to our{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Quick answers to common questions about contacting us.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Clock className="w-5 h-5 text-primary" />
                Response Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">General Inquiries</h3>
                <p className="text-muted-foreground">
                  We typically respond within 24-48 hours during business days (Monday-Friday).
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Support</h3>
                <p className="text-muted-foreground">
                  Urgent technical issues are prioritized and usually receive a response within 4-8 hours.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Sales & Enterprise</h3>
                <p className="text-muted-foreground">
                  Sales inquiries are handled promptly, typically within 12-24 hours. We're happy to schedule a call or demo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}


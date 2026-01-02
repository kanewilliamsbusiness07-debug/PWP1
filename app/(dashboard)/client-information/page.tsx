import { type Metadata } from "next";
import { redirect } from 'next/navigation';
import { ClientRedirect } from './client-redirect';

export const metadata: Metadata = {
  title: "Client Information",
  description: "View and manage client information",
};

export default function ClientInformationPage() {
  return <ClientRedirect />;
}
 
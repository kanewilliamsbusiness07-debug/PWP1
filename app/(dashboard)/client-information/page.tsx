import { type Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Client Information",
  description: "View and manage client information",
};

export default function ClientInformationPage() {
  redirect('/client-information/personal');
}
 
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Information",
  description: "View and manage client information",
};

import { ClientPage } from './client-page';

export default function ClientInformationPage() {
  return <ClientPage />;
}

import { redirect } from 'next/navigation';

export default function RootHomePage() {
  // Automatically redirect from http://localhost:3000/ to the terminal route
  redirect('/en/cabinet/deposit-step-1');
}
import { getTestimonios } from '@/actions/testimonios';
import TestimoniosClient from './TestimoniosClient';

export default async function TestimoniosPage() {
  const testimonios = await getTestimonios();
  return <TestimoniosClient initialTestimonios={testimonios} />;
}

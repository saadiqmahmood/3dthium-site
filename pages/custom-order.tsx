import CustomOrderForm from '@/components/sections/CustomOrderForm'
import CustomGallery from '@/components/sections/CustomGallery'

export default function CustomOrderPage() {
    return (
        <section className="p-8">
            <div className="py-10 px-4 sm:px-6 md:px-10 max-w-5xl my-16 mx-auto bg-gray-50 rounded-xl">
                <h1 className="text-2xl md:text-3xl font-bold mb-8 text-stone-800 px-8">Request a Custom 3D Print</h1>
                <p className="text-gray-600 mb-10 px-8">
                    Fill out the form below to request a personalized 3D printed item. You can upload your design files and we’ll review them to provide a quote.
                </p>

                <CustomOrderForm />
            </div>

            <div className="max-w-7xl mx-auto">
                <CustomGallery />
            </div>
        </section>
    )
}
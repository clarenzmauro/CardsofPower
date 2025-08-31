"use client";

import Link from "next/link";
import Image from "next/image";

export default function MainMenuPage() {
    // large buttons
    const bannerItems = [
        { label: "Workshop", href: "/workshop", image: "/assets/menu/workshop.png" },
        { label: "Battlefield", href: "/battlefield", image: "/assets/menu/battle.png" },
        { label: "Shop", href: "/shop", image: "/assets/menu/shop.png" },
    ];
    
    // small buttons
    const linkItems = [
        { label: "Inventory", href: "/inventory", image: "/assets/menu/inventory.png" },
        { label: "Dictionary", href: "/dictionary", image: "/assets/menu/dictionary.png" },
        { label: "Friends", href: "/friends", image: "/assets/menu/friends.png" },
        { label: "Account", href: "/account", image: "/assets/menu/account.png" },
		// { label: "Upload Card", href: "/upload", image: "/assets/menu/upload.png" },
    ];

    return (
		<div 
		// background image
			id="home"
			className="bg-cover bg-center relative flex flex-col min-h-screen"
			style={{ backgroundImage: "url('/assets/backgrounds/login.jpg')" }}
		>
			{/* black background overlay */}
			<div className="overlay absolute inset-0 bg-black/85 z-10" />
	
			{/* large buttons */}
			<div className="banners relative z-20 h-[70vh] flex flex-row justify-center items-center">
				{bannerItems.map((item) => (
					<Link key={item.label} href={item.href as any} className="group">
						<div className="relative overflow-hidden">
							<Image
								src={item.image}
								alt={item.label}
								width={350}  
								height={400} 
								className="h-full w-auto object-contain hover:translate-y-4 transition-transform"
							/>
						</div>
					</Link>
				))}
			</div>
			
			{/* small buttons */}
			<div className="links relative z-20 h-[30vh] flex justify-center items-center">
				<div className="flex gap-8">
					{linkItems.map((item) => (
						<Link key={item.label} href={item.href as any} className="group flex flex-col items-center justify-center">
							<div className="relative mb-2">
								<Image
									src={item.image}
									alt={item.label}
									width={100}
									height={100}
									className="h-[12vh] w-auto object-contain hover:scale-110 transition-transform"
								/>
							</div>
							<span 
								className="text-white text-sm group-hover:text-yellow-300 transition-colors"
								style={{ fontFamily: 'var(--font-pirata-one)' }}
							>
								{item.label}
							</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
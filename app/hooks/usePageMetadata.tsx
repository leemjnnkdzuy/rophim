import {useEffect} from "react";

interface MetadataConfig {
	title: string;
	description: string;
	ogImage?: string;
	ogTitle?: string;
	ogDescription?: string;
}

export function usePageMetadata(metadata: MetadataConfig) {
	useEffect(() => {
		// Update document title
		document.title = metadata.title;

		// Update description meta tag
		let descriptionTag = document.querySelector('meta[name="description"]');
		if (!descriptionTag) {
			descriptionTag = document.createElement("meta");
			descriptionTag.setAttribute("name", "description");
			document.head.appendChild(descriptionTag);
		}
		descriptionTag.setAttribute("content", metadata.description);

		// Update og:title
		let ogTitleTag = document.querySelector('meta[property="og:title"]');
		if (!ogTitleTag) {
			ogTitleTag = document.createElement("meta");
			ogTitleTag.setAttribute("property", "og:title");
			document.head.appendChild(ogTitleTag);
		}
		ogTitleTag.setAttribute("content", metadata.ogTitle || metadata.title);

		// Update og:description
		let ogDescTag = document.querySelector(
			'meta[property="og:description"]',
		);
		if (!ogDescTag) {
			ogDescTag = document.createElement("meta");
			ogDescTag.setAttribute("property", "og:description");
			document.head.appendChild(ogDescTag);
		}
		ogDescTag.setAttribute(
			"content",
			metadata.ogDescription || metadata.description,
		);

		if (metadata.ogImage) {
			let ogImageTag = document.querySelector(
				'meta[property="og:image"]',
			);
			if (!ogImageTag) {
				ogImageTag = document.createElement("meta");
				ogImageTag.setAttribute("property", "og:image");
				document.head.appendChild(ogImageTag);
			}
			ogImageTag.setAttribute("content", metadata.ogImage);
		}
	}, [metadata]);
}

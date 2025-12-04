export type LinkInfoResponse = {
	found: boolean;
	item: {
		createdAt: string;
		validity: number;
		payload: string;
		type: 'link';
		inheritParam: boolean;
		inheritPath: boolean;
	};
};

export class Storage {
	constructor(
		private baseUrl: string,
		private adminToken: string,
	) {}

	/**
	 * Get a link by slug
	 */
	async get(slug: string): Promise<string | null> {
		try {
			const url = new URL(`_/${slug}`, this.baseUrl);
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.adminToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				return null;
			}

			const data = (await response.json()) as LinkInfoResponse;
			if (data.found && data.item) {
				return data.item.payload;
			}
			return null;
		} catch (error) {
			console.error(`Error retrieving link ${slug}:`, error);
			return null;
		}
	}

	/**
	 * Create or update a link
	 */
	async put(slug: string, url: string): Promise<void> {
		try {
			const fetchUrl = new URL(`_/${slug}`, this.baseUrl);
			const response = await fetch(fetchUrl, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${this.adminToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					type: 'link',
					payload: url,
				}),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			console.error(`Error storing link ${slug}:`, error);
			throw new Error('Failed to create short URL');
		}
	}

	/**
	 * Delete a link by slug
	 */
	async delete(slug: string): Promise<void> {
		try {
			const url = new URL(`_/${slug}`, this.baseUrl);
			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${this.adminToken}`,
				},
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			console.error(`Error deleting link ${slug}:`, error);
			throw new Error('Failed to delete short URL');
		}
	}
}

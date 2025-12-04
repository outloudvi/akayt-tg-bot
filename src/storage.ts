type LinkInfoResponse = {
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
	async get(slug: string): Promise<LinkInfoResponse> {}
	async put(slug: string, url: string): Promise<void> {}
	async delete(slug: string): Promise<void> {}
}

import {InputFile} from 'grammy'
import {LabeledPrice, Location, ParseMode, Venue} from '@grammyjs/types'
import {ReadonlyDeep} from 'type-fest'

import {hasTruthyKey, isObject} from './generic-types.js'

export type Body = string | TextBody | MediaBody | LocationBody | VenueBody | InvoiceBody

export type MediaType = 'animation' | 'audio' | 'document' | 'photo' | 'video'
export const MEDIA_TYPES: readonly MediaType[] = ['animation', 'audio', 'document', 'photo', 'video']

interface TextPart {
	readonly text: string;
	readonly parse_mode?: ParseMode;
}

export interface TextBody extends TextPart {
	readonly disable_web_page_preview?: boolean;
}

export interface MediaBody extends Partial<TextPart> {
	readonly type: MediaType;
	readonly media: string | InputFile;
}

export interface LocationBody {
	readonly location: Readonly<Location>;
	readonly live_period?: number;
}

export interface VenueBody {
	readonly venue: ReadonlyDeep<Venue>;
}

export interface InvoiceBody {
	readonly invoice: {
		readonly title: string;
		readonly description: string;
		readonly payload: string;
		readonly provider_token: string;
		readonly currency: string;
		readonly prices: ReadonlyArray<Readonly<LabeledPrice>>;
	};
}

function isKnownMediaType(type: unknown): type is MediaType {
	if (typeof type !== 'string') {
		return false
	}

	return (MEDIA_TYPES as readonly string[]).includes(type)
}

export function isTextBody(body: unknown): body is string | TextBody {
	if (!body) {
		return false
	}

	if (typeof body === 'string') {
		return true
	}

	if (!isObject(body)) {
		return false
	}

	if (body['type'] !== undefined) {
		return false
	}

	if (body['location'] !== undefined) {
		return false
	}

	if (body['venue'] !== undefined) {
		return false
	}

	if (body['invoice'] !== undefined) {
		return false
	}

	return hasTruthyKey(body, 'text')
}

export function isMediaBody(body: unknown): body is MediaBody {
	if (!isObject(body)) {
		return false
	}

	if (!isKnownMediaType(body['type'])) {
		return false
	}

	return hasTruthyKey(body, 'media')
}

function isValidLocation(location: Readonly<Location>): boolean {
	return typeof location.latitude === 'number' && typeof location.longitude === 'number'
}

export function isLocationBody(body: unknown): body is LocationBody {
	if (!hasTruthyKey(body, 'location')) {
		return false
	}

	// Locations can't have text
	if (hasTruthyKey(body, 'text')) {
		return false
	}

	const {location} = body as LocationBody
	return isValidLocation(location)
}

export function isVenueBody(body: unknown): body is VenueBody {
	if (!hasTruthyKey(body, 'venue')) {
		return false
	}

	// Locations can't have text
	if (hasTruthyKey(body, 'text')) {
		return false
	}

	const {venue} = body as VenueBody
	if (!isValidLocation(venue.location)) {
		return false
	}

	return typeof venue.title === 'string' && typeof venue.address === 'string'
}

export function isInvoiceBody(body: unknown): body is InvoiceBody {
	if (!hasTruthyKey(body, 'invoice')) {
		return false
	}

	// Invoices can't have text
	if (hasTruthyKey(body, 'text')) {
		return false
	}

	const {invoice} = body as InvoiceBody
	return typeof invoice.title === 'string' && typeof invoice.description === 'string'
}

export function getBodyText(body: TextBody | string): string {
	return typeof body === 'string' ? body : body.text
}

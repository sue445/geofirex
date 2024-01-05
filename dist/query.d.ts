import { CollectionReference, Query } from "firebase/firestore";
import { Observable } from 'rxjs';
import { FirePoint } from './client';
import { FirebaseApp } from 'firebase/app';
export type QueryFn = (ref: CollectionReference) => Query;
export interface GeoQueryOptions {
    units?: 'km';
    log?: boolean;
}
export interface HitMetadata {
    bearing: number;
    distance: number;
}
export interface GeoQueryDocument {
    hitMetadata: HitMetadata;
}
export declare class GeoFireQuery<T = any> {
    private app;
    private refString?;
    private readonly ref;
    constructor(app: FirebaseApp, refString?: string | CollectionReference);
    /**
     * Queries the Firestore collection based on geograpic radius
     * @param  {FirePoint} center the starting point for the query, i.e gfx.point(lat, lng)
     * @param  {number} radius the radius to search from the centerpoint
     * @param  {string} field the document field that contains the FirePoint data
     * @param  {GeoQueryOptions} opts=defaultOpts
     * @returns {Observable<GeoQueryDocument>} sorted by nearest to farthest
     */
    within(center: FirePoint, radius: number, field: string, opts?: GeoQueryOptions): Observable<(GeoQueryDocument & T)[]>;
    private queryPoint;
}
/**
 * RxJS operator that converts a collection to a GeoJSON FeatureCollection
 * @param  {string} field the document field that contains the FirePoint
 * @param  {boolean=false} includeProps
 */
export declare function toGeoJSON(field: string, includeProps?: boolean): any;
/**
 * Helper function to convert any query from an RxJS Observable to a Promise
 * Example usage: await get( collection.within(a, b, c) )
 * @param  {Observable<any>} observable
 * @returns {Promise<any>}
 */
export declare function get(observable: Observable<any>): Promise<any>;

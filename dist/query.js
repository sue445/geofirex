import { __assign } from "tslib";
import { collection, endAt, getFirestore, orderBy, query, startAt, onSnapshot } from "firebase/firestore";
import { combineLatest, Observable, Subject } from 'rxjs';
import { finalize, first, map, shareReplay, takeUntil } from 'rxjs/operators';
import { bearing, distance, neighbors, setPrecision, toGeoJSONFeature } from './util';
var defaultOpts = { units: 'km', log: false };
var GeoFireQuery = /** @class */ (function () {
    function GeoFireQuery(app, refString) {
        this.app = app;
        this.refString = refString;
        if (typeof refString === 'string') {
            var db = getFirestore(app);
            this.ref = collection(db, refString);
            // this.ref = this.app.firestore().collection(ref);
        }
        else {
            this.ref = refString;
        }
    }
    // GEO QUERIES
    /**
     * Queries the Firestore collection based on geograpic radius
     * @param  {FirePoint} center the starting point for the query, i.e gfx.point(lat, lng)
     * @param  {number} radius the radius to search from the centerpoint
     * @param  {string} field the document field that contains the FirePoint data
     * @param  {GeoQueryOptions} opts=defaultOpts
     * @returns {Observable<GeoQueryDocument>} sorted by nearest to farthest
     */
    GeoFireQuery.prototype.within = function (center, radius, field, opts) {
        var _this = this;
        opts = __assign(__assign({}, defaultOpts), opts);
        var tick = Date.now();
        var precision = setPrecision(radius);
        var radiusBuffer = radius * 1.02; // buffer for edge distances
        var centerHash = center.geohash.substr(0, precision);
        var area = neighbors(centerHash).concat(centerHash);
        var _a = center.geopoint, centerLat = _a.latitude, centerLng = _a.longitude;
        // Used to cancel the individual geohash subscriptions
        var complete = new Subject();
        // Map geohash neighbors to individual queries
        var queries = area.map(function (hash) {
            var query = _this.queryPoint(hash, field);
            return createStream(query).pipe(snapToData(), takeUntil(complete));
        });
        // Combine all queries concurrently
        var combo = combineLatest.apply(void 0, queries).pipe(map(function (arr) {
            // Combine results into a single array
            var reduced = arr.reduce(function (acc, cur) { return acc.concat(cur); });
            // Filter by radius
            var filtered = reduced.filter(function (val) {
                var _a = val[field].geopoint, latitude = _a.latitude, longitude = _a.longitude;
                return (distance([centerLat, centerLng], [latitude, longitude]) <=
                    radiusBuffer);
            });
            // Optional logging
            if (opts.log) {
                console.group('GeoFireX Query');
                console.log("\uD83C\uDF10 Center ".concat([centerLat, centerLng], ". Radius ").concat(radius));
                console.log("\uD83D\uDCCD Hits: ".concat(reduced.length));
                console.log("\u231A Elapsed time: ".concat(Date.now() - tick, "ms"));
                console.log("\uD83D\uDFE2 Within Radius: ".concat(filtered.length));
                console.groupEnd();
            }
            // Map and sort to final output
            return filtered
                .map(function (val) {
                var _a = val[field].geopoint, latitude = _a.latitude, longitude = _a.longitude;
                var hitMetadata = {
                    distance: distance([centerLat, centerLng], [latitude, longitude]),
                    bearing: bearing([centerLat, centerLng], [latitude, longitude])
                };
                return __assign(__assign({}, val), { hitMetadata: hitMetadata });
            })
                .sort(function (a, b) { return a.hitMetadata.distance - b.hitMetadata.distance; });
        }), shareReplay(1), finalize(function () {
            opts.log && console.log('✋ Query complete');
            complete.next(true);
        }));
        return combo;
    };
    GeoFireQuery.prototype.queryPoint = function (geohash, field) {
        var end = geohash + '~';
        return query(this.ref, orderBy("".concat(field, ".geohash")), startAt(geohash), endAt(end));
        /*return (this.ref as CollectionReference)
          .orderBy(`${field}.geohash`)
          .startAt(geohash)
          .endAt(end);*/
    };
    return GeoFireQuery;
}());
export { GeoFireQuery };
function snapToData(id) {
    if (id === void 0) { id = 'id'; }
    return map(function (querySnapshot) {
        return querySnapshot.docs.map(function (v) {
            var _a;
            return __assign(__assign({}, (id ? (_a = {}, _a[id] = v.id, _a) : null)), v.data());
        });
    });
}
/**
internal, do not use. Converts callback to Observable.
 */
function createStream(input) {
    return new Observable(function (observer) {
        var unsubscribe = onSnapshot(input, function (val) { return observer.next(val); }, function (err) { return observer.error(err); });
        return { unsubscribe: unsubscribe };
    });
}
/**
 * RxJS operator that converts a collection to a GeoJSON FeatureCollection
 * @param  {string} field the document field that contains the FirePoint
 * @param  {boolean=false} includeProps
 */
export function toGeoJSON(field, includeProps) {
    if (includeProps === void 0) { includeProps = false; }
    return map(function (data) {
        return {
            type: 'FeatureCollection',
            features: data.map(function (v) {
                return toGeoJSONFeature([v[field].geopoint.latitude, v[field].geopoint.longitude], includeProps ? __assign({}, v) : {});
            })
        };
    });
}
/**
 * Helper function to convert any query from an RxJS Observable to a Promise
 * Example usage: await get( collection.within(a, b, c) )
 * @param  {Observable<any>} observable
 * @returns {Promise<any>}
 */
export function get(observable) {
    return observable.pipe(first()).toPromise();
}
//# sourceMappingURL=query.js.map
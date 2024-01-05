import { GeoFireQuery } from './query';
import { encode, distance, bearing } from './util';
import { GeoPoint } from 'firebase/firestore';
var GeoFireClient = /** @class */ (function () {
    function GeoFireClient(app) {
        this.app = app;
    }
    /**
     * Creates reference to a Firestore collection that can be used to make geoqueries
     * @param  {firestore.CollectionReference | firestore.Query | string} ref path to collection
     * @returns {GeoFireQuery}
     */
    GeoFireClient.prototype.query = function (ref) {
        return new GeoFireQuery(this.app, ref);
    };
    /**
     * Creates an object with a geohash. Save it to a field in Firestore to make geoqueries.
     * @param  {number} latitude
     * @param  {number} longitude
     * @returns FirePoint
     */
    GeoFireClient.prototype.point = function (latitude, longitude) {
        return {
            geopoint: new GeoPoint(latitude, longitude),
            geohash: encode(latitude, longitude, 9)
        };
    };
    /**
     * Haversine distance between points
     * @param  {FirePoint} from
     * @param  {FirePoint} to
     * @returns number
     */
    GeoFireClient.prototype.distance = function (from, to) {
        return distance([from.geopoint.latitude, from.geopoint.longitude], [to.geopoint.latitude, to.geopoint.longitude]);
    };
    /**
     * Haversine bearing between points
     * @param  {FirePoint} from
     * @param  {FirePoint} to
     * @returns number
     */
    GeoFireClient.prototype.bearing = function (from, to) {
        return bearing([from.geopoint.latitude, from.geopoint.longitude], [to.geopoint.latitude, to.geopoint.longitude]);
    };
    return GeoFireClient;
}());
export { GeoFireClient };
/**
 * Initialize the library by passing it your Firebase app
 * @param  {FirebaseApp} app
 * @returns GeoFireClient
 */
export function init(app) {
    return new GeoFireClient(app);
}
//# sourceMappingURL=client.js.map
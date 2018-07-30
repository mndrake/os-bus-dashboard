import json
from urllib.request import urlopen
import pandas as pd


# Load static trip and shape data
trips = pd.read_csv('data/trips.csv')
shapes = pd.read_csv('data/shapes.csv')


def get_metro_data(path):
    """
    Download data from the Twin Cities Metro Transit API
    http://svc.metrotransit.org/NexTrip/help
    :param path: route path
    :return: trip data for path
    """
    url = 'http://svc.metrotransit.org/NexTrip/{}?format=json'.format(path)
    with urlopen(url) as request:
        data = json.loads(request.read().decode())
        return data


def get_route_shape(route):
    """
    Get the shape for a particular route. This isn't perfect. Each route has a
    large number of different trips, and each trip can have a different shape.
    This function simply returns the most commonly-used shape across all trips for
    a particular route.
    :param route: route number
    :return: shape for given route
    """
    if route == 0:
        return []
    else:
        route_id = '{}-75'.format(route)
        # For this route, get all the shape_ids listed in trips, and a count of how
        # many times each shape is used. We'll just pick the most commonly-used shape.
        shape_id = trips[trips['route_id'] == route_id]['shape_id'].value_counts().index[0]

        # Get the coordinates for the shape_id
        rows = shapes[shapes['shape_id'] == shape_id].to_dict(orient='records')
        return [[x['shape_pt_lat'], x['shape_pt_lon']] for x in rows]


class BusRoutes(object):

    def __init__(self):
        self.__vehicle_locations = pd.DataFrame(get_metro_data("vehicleLocations/0"))

    def get_vehicle_locations(self, refresh=False):
        if refresh:
            self.__vehicle_locations = pd.DataFrame(get_metro_data("vehicleLocations/0"))
        return self.__vehicle_locations

    def get_route_numbers(self, refresh=False):
        live_vehicles = self.get_vehicle_locations(refresh)
        route_numbers = {int(x): x for x in live_vehicles['Route'].unique()}
        route_numbers[0] = 'All'

        return sorted(
            [{'value': k, 'text': v} for (k, v) in route_numbers.items()],
            key=lambda x: x['value'])

    def get_route_info(self, route_number: int, refresh=False):
            locations = self.get_vehicle_locations(refresh)
            if route_number != 0:
                locations = locations[locations['Route'].astype(int) == route_number]
            summary_init = locations['Direction'].value_counts().to_dict()
            summary_final = dict((x, 0) for x in range(5))
            for i in summary_init:
                summary_final[i] = summary_init[i]
            summary_final[0] = sum(summary_init.values())
            locations = locations.loc[:, ['VehicleLatitude', 'VehicleLongitude', 'Direction']].to_dict(orient='records')
            shape = get_route_shape(route_number)
            return {'locations': locations, 'shape': shape, 'summary': summary_final}

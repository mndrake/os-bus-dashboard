from flask import Flask, render_template, jsonify
import methods
import warnings

# per https://stackoverflow.com/questions/40845304/runtimewarning-numpy-dtype-size-changed-may-indicate-binary-incompatibility
warnings.filterwarnings("ignore", message="numpy.dtype size changed")
warnings.filterwarnings("ignore", message="numpy.ufunc size changed")


application = Flask(__name__)


direction_colors = [
    {'text': 'North', 'id': 4, 'color': '#BA48AA'},
    {'text': 'South', 'id': 1, 'color': '#595490'},
    {'text': 'East', 'id': 2, 'color': '#527525'},
    {'text': 'West', 'id': 3, 'color': '#A93F35'},
]

bus_routes = methods.BusRoutes()


@application.route('/')
def index():
    return render_template('index.html', direction_colors=direction_colors)


@application.route('/api/route-numbers')
def route_numbers():
    return jsonify(bus_routes.get_route_numbers())


@application.route('/api/route-info/<int:route_number>')
def route_info(route_number):
    return jsonify(bus_routes.get_route_info(route_number, refresh=True))


if __name__ == '__main__':
    application.run()

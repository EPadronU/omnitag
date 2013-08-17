# Modules ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import json

from flask import Flask
#from flask import make_response
from flask import request
from flask import render_template
from flask_peewee.db import Database
from peewee import *
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# General configuration ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
DATABASE = {
        'name': 'devel.db',
        'engine': 'peewee.SqliteDatabase',
}
DEBUG = True
SECRET_KEY = 'secret'
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Main initialization ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app = Flask(__name__)
app.config.from_object(__name__)
db = Database(app)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Models ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
RESOURCE_TYPES = (('F', 'B'), ('File', 'Bookmark'))
class Resource(db.Model):
    name = CharField(max_length=50, null=False)
    type = CharField(max_length=5, null=False, choices=RESOURCE_TYPES, default='F')

    def __hash__(self):
        return self.__repr__().__hash__()

    def __repr__(self):
        return str(self.dump_as_json())

    def dump_as_json(self):
        return {'id': self.id, 'name': self.name}


class Tag(db.Model):
    name = CharField(max_length=20, null=False, index=True)

    def __hash__(self):
        return self.name.__hash__()

    def __repr__(self):
        return str(self.dump_as_json())

    def dump_as_json(self):
        return {'id': self.id, 'name': self.name}

    @classmethod
    def get_by_id(cls, ids):
        return [row.id for row in cls.select().where(cls.id << ids)]

    @classmethod
    def get_by_name(cls, names):
        return [row.id for row in cls.select().where(cls.name << names)]


class TagResource(db.Model):
    resource = ForeignKeyField(Resource)
    tag = ForeignKeyField(Tag)

    def __repr__(self):
        return str(self.dump_as_json())

    def dump_as_json(self):
        return {'resource': self.resource, 'tag': self.tag}

    @classmethod
    def get_resources_by_tags(cls, tags):
        return set(row.resource for row in cls.select().where(cls.tag << tags))
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
@app.route('/')
def index():
    return render_template("main-view.html")

@app.route("/add-tag", methods=['POST'])
def add_tag():
    tag_name = json.loads(request.data)

    if not Tag.get_by_name([tag_name]):
        Tag.create(name=tag_name)
        return json.dumps({"status": "sucess"})
    return json.dumps({"status": "failure"})

@app.route("/explorer", methods=['GET', 'POST'])
def explorer():
    if request.method == 'GET':
        return render_template("main-view.html", tags=Tag.select())

    else:
        tags_id = json.loads(request.data)
        tags = Tag.get_by_id(tags_id)
        resources = TagResource.get_resources_by_tags(tags)
        return render_template("resources.html", resources=resources)

if __name__ == "__main__":
    app.run()

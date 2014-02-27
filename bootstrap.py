#!/usr/bin/env python

from omnitag import Device
from omnitag import Resource
from omnitag import Search
from omnitag import Tag
from omnitag import TagResource
from omnitag import TagSearch
from omnitag import User

# Database's initialisation ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Device.create_table(fail_silently=True)
Resource.create_table(fail_silently=True)
Search.create_table(fail_silently=True)
Tag.create_table(fail_silently=True)
TagResource.create_table(fail_silently=True)
TagSearch.create_table(fail_silently=True)
User.create_table(fail_silently=True)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

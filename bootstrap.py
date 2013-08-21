from omnitag import Resource
from omnitag import Search
from omnitag import Tag
from omnitag import TagResource
from omnitag import TagSearch

# Database's initialisation ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Resource.create_table(fail_silently=True)
Search.create_table(fail_silently=True)
Tag.create_table(fail_silently=True)
TagResource.create_table(fail_silently=True)
TagSearch.create_table(fail_silently=True)
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# Testing data ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
photo001 = Resource.create(name="photo001.jpg"); photo001.save()
photo002 = Resource.create(name="photo002.jpg"); photo002.save()
photo003 = Resource.create(name="photo003.jpg"); photo003.save()
photo004 = Resource.create(name="photo004.jpg"); photo004.save()
report = Resource.create(name="report.odt"); report.save()
review = Resource.create(name="review.odt"); review.save()
letter = Resource.create(name="letter.odt"); letter.save()

Resource.create(name="index.html").save()
Resource.create(name="style.css").save()
Resource.create(name="script.js").save()

family = Tag.create(name="family"); family.save()
photos = Tag.create(name="photos"); photos.save()
travel = Tag.create(name="travel"); travel.save()
work = Tag.create(name="work"); work.save()

TagResource.create(resource=photo001, tag=family).save()
TagResource.create(resource=photo002, tag=family).save()
TagResource.create(resource=photo001, tag=photos).save()
TagResource.create(resource=photo002, tag=photos).save()
TagResource.create(resource=photo003, tag=photos).save()
TagResource.create(resource=photo004, tag=photos).save()
TagResource.create(resource=photo002, tag=travel).save()
TagResource.create(resource=photo004, tag=travel).save()
TagResource.create(resource=letter, tag=family).save()
TagResource.create(resource=letter, tag=travel).save()
TagResource.create(resource=report, tag=work).save()
TagResource.create(resource=review, tag=work).save()
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

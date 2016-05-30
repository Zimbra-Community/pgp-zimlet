BUILDDIR=zimlets-extra

build:
	@echo "Building $@"
	@mkdir -p $(BUILDDIR)
	@cd tk_barrydegraaff_zimbra_openpgp && zip -r ../$(BUILDDIR)/tk_barrydegraaff_zimbra_openpgp.zip *

clean:
	@rm -Rf $(BUILDDIR)

install: 
	mkdir -p $(DESTDIR)/opt/zimbra/zimlets-extra
	cp -R $(BUILDDIR)/tk_barrydegraaff_zimbra_openpgp.zip $(DESTDIR)/opt/zimbra/zimlets-extra

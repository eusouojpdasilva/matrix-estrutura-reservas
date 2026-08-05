-- 0023_proposals_activities.sql
-- Campo de Passeios/Extras (experiências avulsas) nas propostas: descrição + preço,
-- exibido na página pública entre Hospedagem e Roteiro. Mesmo padrão de hotels/flights/itinerary.

ALTER TABLE proposals ADD COLUMN activities TEXT DEFAULT '[]';
